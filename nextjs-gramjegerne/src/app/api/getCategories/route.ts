// src/app/api/getCategories/route.ts

import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

export async function GET() {
  try {
    // Categories are shared across users, so we just verify authentication
    await getUserSession();

    const categories = await client.fetch(`*[_type == "category"]{
      _id,
      title,
      slug
    }`);

    return NextResponse.json(categories, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories." },
      { status: 500 },
    );
  }
}
