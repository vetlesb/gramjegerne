import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";

// Define an interface for the item structure
interface Item {
  _id: string;
  _type: string;
  // Add other properties as needed
}

export async function DELETE() {
  try {
    const items: Item[] = await client.fetch(`*[_type == "item"]`);

    const BATCH_SIZE = 10; // Define a batch size

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const deletePromises = batch.map((item: Item) => client.delete(item._id));

      try {
        await Promise.all(deletePromises);
      } catch (error) {
        const typedError = error as Error;
        console.error("Error deleting batch:", typedError);
        // Handle rate limit error or other errors here
      }
    }

    return NextResponse.json({ message: "All items cleared." });
  } catch (error) {
    const typedError = error as Error;
    console.error("Error clearing items:", typedError);
    return NextResponse.json(
      { message: "Failed to clear items.", error: typedError.message },
      { status: 500 },
    );
  }
}
