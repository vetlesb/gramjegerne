import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json(
        { success: false, error: "List ID is required" },
        { status: 400 },
      );
    }

    // Fetch the list to get associated items
    const list = await client.getDocument(listId);

    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 },
      );
    }

    // If items are separate documents, delete them
    if (list.items && list.items.length > 0) {
      const itemIds = list.items.map((item: { _ref: string }) => item._ref);

      // Build a transaction to delete all items
      const transaction = client.transaction();
      itemIds.forEach((itemId: string) => {
        transaction.delete(itemId);
      });

      // Delete the list
      transaction.delete(listId);

      await transaction.commit();
    } else {
      // If there are no items, just delete the list
      await client.delete(listId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting list:", error);

    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
