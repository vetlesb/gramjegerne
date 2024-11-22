import { client } from "@/sanity/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import { nanoid } from "nanoid";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id.startsWith("google_")
      ? session.user.id
      : `google_${session.user.id}`;

    const { listId, itemKey, categoryId } = await request.json();

    if (!listId || !itemKey || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Sanitize the itemKey for use in Sanity
    const sanitizedKey = itemKey.replace(/[^a-zA-Z0-9]/g, "_");

    // First verify the list belongs to the user
    const userList = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]`,
      { listId, userId },
    );

    if (!userList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Update the category override using the new array structure
    const result = await client
      .patch(listId)
      .setIfMissing({ categoryOverrides: [] })
      .insert("after", "categoryOverrides[-1]", [
        {
          _key: nanoid(),
          _type: "override",
          itemKey: sanitizedKey,
          categoryId: categoryId,
        },
      ])
      .commit();

    if (!result) {
      throw new Error("Failed to update Sanity document");
    }

    return NextResponse.json({
      success: true,
      result,
      sanitizedKey, // Return this so frontend knows what key was used
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update category",
      },
      { status: 500 },
    );
  }
}
