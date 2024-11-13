// src/app/api/getCategories/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!, // Ensure this token has read permissions if using it
  useCdn: true, // Use CDN for faster responses if data doesn't need to be fresh
  apiVersion: "2023-01-01",
});

export async function GET() {
  try {
    const categories = await client.fetch(`*[_type == "category"]{_id, title}`);
    return NextResponse.json(categories, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 },
    );
  }
}
