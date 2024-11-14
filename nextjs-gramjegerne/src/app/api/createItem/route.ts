// src/app/api/items/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, // Non-null assertion if you are sure it's set
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function POST(request: Request) {
  try {
    // Parse FormData
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const slug =
      (formData.get("slug") as string) ||
      name.toLowerCase().replace(/\s+/g, "-").slice(0, 200);
    const imageFile = formData.get("image") as File | null;
    const categoryId = formData.get("category") as string;
    const size = formData.get("size") as string;
    const weight_weight = formData.get("weight.weight") as string;
    const weight_unit = formData.get("weight.unit") as string;
    const quantity = formData.get("quantity") as string;
    const calories = formData.get("calories") as string;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { message: "Navn og slug er obligatorisk." },
        { status: 400 },
      );
    }

    // Handle image upload if provided
    let imageAsset: string | undefined = undefined;
    if (imageFile) {
      const imageResponse = await client.assets.upload("image", imageFile, {
        filename: imageFile.name,
      });
      imageAsset = imageResponse._id;
    }

    // Create category references with unique _key
    const categoryRef = {
      _type: "reference",
      _ref: categoryId,
    };

    // Construct the new item object
    const newItem = {
      _type: "item",
      name,
      slug: {
        _type: "slug",
        current: slug,
      },
      ...(imageAsset && {
        image: { _type: "image", asset: { _ref: imageAsset } },
      }),
      category: categoryRef,
      size,
      weight: {
        weight: Number(weight_weight),
        unit: weight_unit,
      },
      quantity: Number(quantity),
      calories: Number(calories),
    };

    // Create the item in Sanity
    const createdItem = await client.create(newItem);

    return NextResponse.json(createdItem, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { message: "Failed to create item." },
      { status: 500 },
    );
  }
}
