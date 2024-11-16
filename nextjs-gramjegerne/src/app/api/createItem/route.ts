// src/app/api/items/route.ts

import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

// Define interfaces for type safety
interface SanityDocument {
  _type: string;
  name: string;
  slug: {
    _type: string;
    current: string;
  };
  user: {
    _type: string;
    _ref: string;
  };
  category?: {
    _type: string;
    _ref: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const formData = await request.formData();
    console.log("API: Received form data:", Object.fromEntries(formData));

    const name = formData.get("name")?.toString() || "";
    const slug = formData.get("slug")?.toString() || "";

    if (!name || !slug) {
      return new Response(
        JSON.stringify({ message: "Name and slug are required" }),
        { status: 400 },
      );
    }

    // Use the consistent user ID format
    const userId = session.user.id;

    // Create item document with reference to user's ID
    const document: SanityDocument = {
      _type: "item",
      name: name,
      slug: {
        _type: "slug",
        current: slug,
      },
      user: {
        _type: "reference",
        _ref: userId, // Use the formatted ID directly
      },
    };

    // Only add category if it exists and is not empty
    const categoryId = formData.get("category")?.toString();
    if (categoryId && categoryId !== "") {
      document.category = {
        _type: "reference",
        _ref: categoryId,
      };
    }

    console.log("API: Creating document:", document);

    const result = await client.create(document);
    console.log("API: Created document:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API: Server error:", error);
    return new Response(
      JSON.stringify({
        message: "Error creating item",
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 },
    );
  }
}
