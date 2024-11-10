// app/api/deleteCategory/route.ts
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function DELETE(request: Request) {
  const { categoryId } = await request.json();

  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 },
    );
  }

  try {
    // Log the category ID before deletion
    console.log("Attempting to delete category ID:", categoryId);

    // Use the Sanity client to delete the category
    await client.delete(categoryId);
    return NextResponse.json({
      message: "Category deleted successfully",
      categoryId,
    });
  } catch (error) {
    // Use a type assertion to specify that error is of type any
    console.error("Error deleting category:", error);
    const errorMessage =
      (error as Error).message || "Failed to delete category";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
