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

    if (!listId) {
      return NextResponse.json(
        { error: "List ID is required" },
        { status: 400 },
      );
    }

    // Update the list with new items array
    // Expecting items to be an array of references with _key, _type, and _ref
    const result = await client
      .patch(listId)
      .set({
        items: items, // Items should already be in the correct reference format
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
