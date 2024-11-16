import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return NextResponse.json(
        { success: false, error: "List ID is required" },
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
        { success: false, error: "List not found or unauthorized" },
        { status: 404 },
      );
    }

    await client.delete(listId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Error deleting list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
