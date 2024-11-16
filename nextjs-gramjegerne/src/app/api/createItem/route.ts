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
  size?: string;
  weight?: {
    weight: number;
    unit: string;
  };
  calories?: number;
  image?: {
    _type: string;
    asset: {
      _type: string;
      _ref: string;
    };
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

    // Required fields
    const name = formData.get("name")?.toString();
    const slug = formData.get("slug")?.toString();
    const categoryId = formData.get("category")?.toString();

    if (!name || !slug || !categoryId) {
      return new Response(
        JSON.stringify({
          message: "Name, slug, and category are required",
        }),
        { status: 400 },
      );
    }

    // Create base document
    const document: SanityDocument = {
      _type: "item",
      name: name.trim(),
      slug: {
        _type: "slug",
        current: slug,
      },
      user: {
        _type: "reference",
        _ref: session.user.id,
      },
      category: {
        _type: "reference",
        _ref: categoryId,
      },
    };

    // Optional fields
    const size = formData.get("size")?.toString();
    if (size && size.trim()) {
      document.size = size.trim();
    }

    // Handle weight
    const weightData = formData.get("weight")?.toString();
    if (weightData) {
      try {
        const parsedWeight = JSON.parse(weightData);
        if (parsedWeight.weight > 0) {
          document.weight = {
            weight: parsedWeight.weight,
            unit: parsedWeight.unit || "g",
          };
        }
      } catch (e) {
        console.error("Error parsing weight:", e);
      }
    }

    // Handle calories
    const calories = formData.get("calories")?.toString();
    if (calories && !isNaN(Number(calories))) {
      const caloriesNum = Number(calories);
      if (caloriesNum > 0) {
        document.calories = caloriesNum;
      }
    }

    // Handle image if present
    const image = formData.get("image") as File | null;
    if (image) {
      try {
        const imageAsset = await client.assets.upload("image", image);
        document.image = {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAsset._id,
          },
        };
      } catch (e) {
        console.error("Error uploading image:", e);
      }
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
