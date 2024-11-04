import { NextResponse } from "next/server";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";

// GROQ query to fetch the list data based on slug
const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

// Handle GET request
export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  try {
    // Fetch the data based on slug
    const listData = await client.fetch(LIST_QUERY, { slug });

    // Check if the listData exists
    if (!listData) {
      return NextResponse.json({ message: "List not found" }, { status: 404 });
    }

    // Return the fetched data as JSON
    return NextResponse.json(listData);
  } catch (error) {
    console.error("Error fetching list data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Handle POST request (optional, implement as needed)
export async function POST(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const body = await request.json(); // Extract the request body
  // Implement logic for creating/updating data based on the slug and body
  return NextResponse.json({
    message: `Created data for slug: ${params.slug}`,
    data: body,
  });
}

// Additional HTTP methods can be handled similarly
