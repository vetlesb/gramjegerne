import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

// Define an interface for the item structure
interface Item {
  _id: string;
  _type: string;
  // Add other properties as needed
}

export async function DELETE() {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Fetch items belonging to the current user
    const items: Item[] = await client.fetch(
      `*[_type == "item" && user._ref == $userId]`,
      { userId: session.user.id },
    );
    console.log("Items to delete:", items); // Log the items to be deleted

    if (items.length === 0) {
      return NextResponse.json({ message: "No items to clear." });
    }

    const BATCH_SIZE = 10; // Define a batch size

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const deletePromises = batch.map(async (item: Item) => {
        console.log(`Attempting to delete item with ID: ${item._id}`); // Log the ID being deleted
        const response = await client.delete(item._id);
        console.log(`Delete response for item ${item._id}:`, response); // Log the response
        return response;
      });

      try {
        await Promise.all(deletePromises);
        console.log(
          `Deleted batch: ${batch.map((item) => item._id).join(", ")}`,
        ); // Log successful deletions
      } catch (error) {
        const typedError = error as Error;
        console.error("Error deleting batch:", typedError);
        console.error(
          "Failed to delete items:",
          batch.map((item) => item._id),
        ); // Log IDs of items that failed
        // Optionally, return an error response here if desired
      }
    }

    return NextResponse.json({ message: "All items cleared for the user." });
  } catch (error) {
    const typedError = error as Error;
    console.error("Error clearing items:", typedError);
    return NextResponse.json(
      { message: "Failed to clear items.", error: typedError.message },
      { status: 500 },
    );
  }
}
