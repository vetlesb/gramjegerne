import { NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import { getUserSession } from "@/lib/auth-helpers";

interface ImportResult {
  success: boolean;
  name: string;
  id?: string;
  error?: string;
}

interface ImportItem {
  name: string;
  size?: string;
  weight?: string;
  weight_unit?: string;
  calories?: string | number;
  categoryId?: string;
  imageAssetId?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    console.log("Session:", session);

    // Check if session and user are valid
    if (!session || !session.user) {
      console.error("Unauthorized access: No session or user found.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const items = (await request.json()) as ImportItem[];
    const results: ImportResult[] = [];

    const CHUNK_SIZE = 20;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);

      for (const item of chunk) {
        try {
          // Check if item already exists for this user
          const existingItem = await client.fetch(
            `*[_type == "item" && name == $name && user._ref == $userId][0]`,
            { name: item.name, userId: session.user.id },
          );

          let categoryRef = null;

          if (item.categoryId) {
            categoryRef = {
              _type: "reference",
              _ref: item.categoryId,
            };
          }

          if (existingItem) {
            // Update the existing item
            const updatedItem = {
              _type: "item",
              size: item.size,
              weight: item.weight
                ? {
                    weight: Number(item.weight),
                    unit: item.weight_unit || "g",
                  }
                : existingItem.weight, // Keep existing weight if not provided
              calories: item.calories
                ? Number(item.calories)
                : existingItem.calories, // Update calories if provided
              category: categoryRef || existingItem.category, // Use new categoryRef or keep existing category
              user: {
                _type: "reference",
                _ref: session.user.id,
              },
            };

            // Update the existing item in the database
            await client
              .patch(existingItem._id)
              .set({
                ...updatedItem,
                ...(item.imageAssetId && {
                  image: {
                    _type: "image",
                    asset: {
                      _type: "reference",
                      _ref: item.imageAssetId,
                    },
                  },
                }),
              })
              .commit();

            results.push({
              success: true,
              name: item.name,
              id: existingItem._id,
            });
            continue; // Skip to the next item
          }

          // Create a new item if it doesn't exist
          const newItem = {
            _type: "item",
            name: item.name,
            slug: {
              _type: "slug",
              current: item.name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .slice(0, 200),
            },
            size: item.size,
            weight: item.weight
              ? {
                  weight: Number(item.weight),
                  unit: item.weight_unit || "g",
                }
              : undefined,
            calories: item.calories ? Number(item.calories) : undefined,
            category: categoryRef, // Use the updated categoryRef here
            user: {
              _type: "reference",
              _ref: session.user.id,
            },
            ...(item.imageAssetId && {
              image: {
                _type: "image",
                asset: {
                  _type: "reference",
                  _ref: item.imageAssetId,
                },
              },
            }),
          };

          console.log("Creating new item:", newItem); // Log the new item being created
          const createdItem = await client.create(newItem);
          results.push({
            success: true,
            name: item.name,
            id: createdItem._id,
          });
        } catch (error) {
          console.error(`Error processing item ${item.name}:`, error);
          results.push({
            success: false,
            name: item.name,
            error:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process items" },
      { status: 500 },
    );
  }
}
