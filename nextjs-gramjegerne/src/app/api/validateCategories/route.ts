import { NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { getUserSession } from "@/lib/auth-helpers";

// Helper function for slugify
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[æå]/g, "a")
    .replace(/[ø]/g, "o")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

interface SanityCategory {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
}

// Define the document structure without the Sanity metadata
interface CategoryInput {
  _type: "category";
  title: string;
  slug: {
    _type: "slug";
    current: string;
  };
  user: {
    _type: "reference";
    _ref: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { categories } = await request.json();
    const userId = session.user.id;

    const existingCategories = await client.fetch<SanityCategory[]>(
      `*[_type == "category" && user._ref == $userId]{
        _id,
        title
      }`,
      { userId },
    );

    const categoryMap: Record<string, string> = {};

    for (const categoryTitle of categories) {
      const category = existingCategories.find(
        (c) => c.title.toLowerCase() === categoryTitle.toLowerCase(),
      );

      if (!category) {
        const newCategoryData: CategoryInput = {
          _type: "category",
          title: categoryTitle,
          slug: {
            _type: "slug",
            current: slugify(categoryTitle),
          },
          user: {
            _type: "reference",
            _ref: userId,
          },
        };

        const newCategory = await client.create(newCategoryData);
        categoryMap[categoryTitle] = newCategory._id;
      } else {
        categoryMap[categoryTitle] = category._id;
      }
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