// app/api/[slug]/route.ts

import { NextResponse } from "next/server"; // For response handling
import { client } from "@/sanity/client"; // Sanity client import
import { groq } from "next-sanity"; // GROQ import

// Define the GROQ query
const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

// Handle GET requests
export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const listData = await client.fetch(LIST_QUERY, { slug });

  if (!listData) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json(listData); // Return the fetched data
}
