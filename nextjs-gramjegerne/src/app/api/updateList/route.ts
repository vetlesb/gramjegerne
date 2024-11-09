// src/app/api/updateList/route.ts

import { NextResponse } from "next/server";
import { client } from "@/sanity/client"; // Adjust the import path as necessary

export async function PUT(request: Request) {
  try {
    const { listId, items } = await request.json();

    // Update the list document in Sanity
    await client
      .patch(listId) // Specify the document ID of the list to patch
      .set({
        items: items.map((itemId: string) => ({
          _type: "reference",
          _ref: itemId,
        })),
      })
      .commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 },
    );
  }
}
