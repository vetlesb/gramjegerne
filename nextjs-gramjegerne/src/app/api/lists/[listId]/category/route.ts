import { client } from "@/sanity/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = request.nextUrl.pathname.split("/").pop();
    if (!listId) {
      return NextResponse.json({ error: "Missing listId" }, { status: 400 });
    }

    const userId = session.user.id.startsWith("google_")
      ? session.user.id
      : `google_${session.user.id}`;

    const { itemKey, categoryId } = await request.json();

    const listCheck = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]._id`,
      { listId, userId },
    );

    if (!listCheck) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await client
      .patch(listId)
      .set({
        [`items[_key == "${itemKey}"].categoryOverride`]: categoryId
          ? { _type: "reference", _ref: categoryId }
          : undefined,
      })
      .commit();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}
