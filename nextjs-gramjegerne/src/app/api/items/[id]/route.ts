import { NextResponse, NextRequest } from "next/server";
import { handleApiError } from "@/lib/errorHandler";
import { createClient } from "@sanity/client";

// Define interfaces for type safety
interface UpdateData {
  name: string | null;
  slug: string | null;
  categories?: Array<{
    _type: "reference";
    _ref: string;
  }>;
  size?: string;
  weight?: {
    weight: number;
    unit: string;
  };
  calories?: number;
  image?: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string;
    };
  };
  [key: string]: unknown;
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function PUT(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { message: "Invalid or missing item ID." },
        { status: 400 },
      );
    }

    const formData = await request.formData();

    const updateData: UpdateData = {
      name: formData.get("name")?.toString() ?? null,
      slug: formData.get("slug")?.toString() ?? null,
    };
    // Handle categories
    const categories = formData.getAll("categories").map((category) => ({
      _type: "reference" as const,
      _ref: category.toString(),
    }));
    if (categories.length > 0) {
      updateData.categories = categories;
    }

    // Handle optional fields
    const size = formData.get("size");
    if (size) updateData.size = size.toString();

    const weightValue = formData.get("weight.weight");
    const weightUnit = formData.get("weight.unit");
    if (weightValue && weightUnit) {
      updateData.weight = {
        weight: parseFloat(weightValue.toString()),
        unit: weightUnit.toString(),
      };
    }

    const calories = formData.get("calories");
    if (calories) updateData.calories = parseInt(calories.toString(), 10);

    // Handle image upload
    const image = formData.get("image");
    if (image instanceof File) {
      try {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        const imageAsset = await client.assets.upload("image", imageBuffer, {
          filename: image.name,
          contentType: image.type,
        });

        updateData.image = {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAsset._id,
          },
        };
      } catch (imageError) {
        console.error("Error uploading image:", imageError);
      }
    }

    const updatedItem = await client.patch(id).set(updateData).commit();

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(
      error,
      "Error updating item:",
      "Kunne ikke oppdatere utstyr.",
    );
  }
}
