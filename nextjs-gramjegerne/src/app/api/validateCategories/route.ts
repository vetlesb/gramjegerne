import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { categories } = await request.json();

    // Get existing categories
    const existingCategories = await client.fetch(
      `*[_type == "category" && user._ref == $userId]{
        _id,
        title
      }`,
      { userId: session.user.id },
    );

    const categoryMap: Record<string, string> = {};

    // Process each category
    for (const categoryTitle of categories) {
      // Check if category exists
      let category = existingCategories.find(
        (c: any) => c.title.toLowerCase() === categoryTitle.toLowerCase(),
      );

      if (!category) {
        // Create new category if it doesn't exist
        category = await client.create({
          _type: "category",
          title: categoryTitle,
          user: {
            _type: "reference",
            _ref: session.user.id,
          },
        });
      }

      categoryMap[categoryTitle] = category._id;
    }

    return NextResponse.json({ categoryMap });
  } catch (error) {
    console.error("Category validation error:", error);
    return NextResponse.json(
      { message: "Failed to process categories" },
      { status: 500 },
    );
  }
}
