import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function PUT(request: Request) {
  try {
    const { listId, items } = await request.json();

    // Update the list with new items array
    const result = await client
      .patch(listId)
      .set({
        items: items.map((item: { _id: string; quantity: number }) => ({
          _type: "object",
          item: {
            _type: "reference",
            _ref: item._id,
          },
          quantity: item.quantity,
        })),
      })
      .commit();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 },
    );
  }
}
