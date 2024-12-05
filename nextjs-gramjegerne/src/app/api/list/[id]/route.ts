import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/errorHandler";
import type { NextRequest } from "next/server";

interface UpdateData {
  name?: string;
  days?: number;
  participants?: number;
  weight?: number;
  image?: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string;
    };
  } | null;
  [key: string]: unknown;
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { pathname } = request.nextUrl;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { message: "Invalid or missing list ID." },
        { status: 400 },
      );
    }

    // Verify list belongs to user
    const list = await client.fetch(
      `*[_type == "list" && _id == $id && user._ref == $userId][0]`,
      { id, userId: session.user.id },
    );

    if (!list) {
      return NextResponse.json(
        { message: "List not found or unauthorized" },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const updateData: UpdateData = {};

    // Handle basic fields
    const name = formData.get("name");
    if (name) updateData.name = name.toString();

    const days = formData.get("days");
    if (days) updateData.days = parseInt(days.toString(), 10);

    const participants = formData.get("participants");
    if (participants)
      updateData.participants = parseInt(participants.toString(), 10);

    const weight = formData.get("weight");
    if (weight) updateData.weight = parseFloat(weight.toString());

    // Handle image upload
    const image = formData.get("image");
    const keepExistingImage = formData.get("keepExistingImage") === "true";

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
    } else if (!keepExistingImage) {
      updateData.image = null;
    }

    const updatedList = await client.patch(id).set(updateData).commit();
    return NextResponse.json(updatedList, { status: 200 });
  } catch (error: unknown) {
    return handleApiError(
      error,
      "Error updating list:",
      "Kunne ikke oppdatere listen.",
    );
  }
}
