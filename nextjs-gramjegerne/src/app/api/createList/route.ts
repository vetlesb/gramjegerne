import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Create the new list document
    const newList = {
      _type: "list",
      name: data.name,
      slug: {
        _type: "slug",
        current: data.name.toLowerCase().replace(/\s+/g, "-"),
      },
      image: data.image,
      days: data.days,
      weight: data.weight,
      participants: data.participants,
      items: [],
    };

    const result = await client.create(newList);

    return NextResponse.json({ success: true, list: result });
  } catch (error) {
    console.error("Error creating list:", error);

    // Use type guard to check if error is an instance of Error
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
