import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

export async function PUT(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const { listId, items } = await request.json();

    if (!listId) {
      return NextResponse.json(
        { error: "List ID is required" },
        { status: 400 },
      );
    }

    // Verify list belongs to user
    const list = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]`,
      { listId, userId: session.user.id },
    );

    if (!list) {
      return NextResponse.json(
        { error: "List not found or unauthorized" },
        { status: 404 },
      );
    }

    const result = await client.patch(listId).set({ items }).commit();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 },
    );
  }
}
