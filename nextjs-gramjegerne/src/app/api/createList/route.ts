// app/api/createList/route.ts
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { nanoid } from "nanoid";

// Initialize Sanity client with server-side token
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2023-01-01",
  token: process.env.SANITY_API_TOKEN, // Ensure this token has write permissions
  useCdn: false,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const image = formData.get("image") as File | null;
    const days = formData.get("days")
      ? parseInt(formData.get("days") as string)
      : null;
    const weight = formData.get("weight")
      ? parseInt(formData.get("weight") as string)
      : null;
    const participants = formData.get("participants")
      ? parseInt(formData.get("participants") as string)
      : null;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Prepare slug
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    // Prepare image asset if provided
    let imageAsset = null;
    if (image) {
      // Convert the File object to a Buffer
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload the image buffer to Sanity
      const imageData = await client.assets.upload("image", buffer, {
        filename: image.name,
        contentType: image.type,
      });

      imageAsset = {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: imageData._id,
        },
      };
    }

    // Create new list document
    const newList = {
      _type: "list",
      _id: nanoid(),
      name,
      slug: {
        _type: "slug",
        current: slug,
      },
      image: imageAsset,
      days,
      weight,
      participants,
      items: [],
    };

    // Save the new list to Sanity
    await client.create(newList);

    return NextResponse.json(
      { message: "List created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating list on server:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
