import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { handleApiError } from "@/lib/errorHandler";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 },
      );
    }

    // Check for references to this item
    const references = await client.fetch(`*[references($itemId)]`, { itemId });

    if (references.length > 0) {
      return NextResponse.json(
        {
          message:
            "Dette utstyret er i bruk i en eller flere lister. Fjern utstyret fra listene før du sletter det.",
          references: references,
        },
        { status: 409 }, // Conflict status code
      );
    }

    // If no references, proceed with deletion
    await client.delete(itemId);

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleApiError(
      error,
      "Error deleting item:",
      "Kunne ikke slette utstyr.",
    );
  }
}
