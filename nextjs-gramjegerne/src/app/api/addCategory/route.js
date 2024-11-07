// src/app/api/addCategory/route.js
import { NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function POST(request) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/\s+/g, "-");

    const newCategory = await client.create({
      _type: "category",
      title,
      slug: { _type: "slug", current: slug },
    });

    return NextResponse.json(newCategory, { status: 200 });
  } catch (error) {
    console.error("Error adding category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 },
    );
  }
}
