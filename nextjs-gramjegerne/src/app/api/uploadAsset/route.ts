import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { message: "No image provided" },
        { status: 400 },
      );
    }

    const asset = await client.assets.upload("image", image);
    return NextResponse.json({ assetId: asset._id });
  } catch (error) {
    console.error("Asset upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 },
    );
  }
}
