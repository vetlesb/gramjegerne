// app/api/createList/route.ts
import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const userId = session.user.id;
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

    // Create new list document with user reference
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
      user: {
        _type: "reference",
        _ref: userId,
      },
    };

    await client.create(newList);
    return NextResponse.json(
      { message: "List created successfully" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
