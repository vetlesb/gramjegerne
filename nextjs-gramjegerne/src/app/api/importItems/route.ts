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
  category?: string;
  image_url?: string;
}

interface SanityCategory {
  _id: string;
  title: string;
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const items = (await request.json()) as ImportItem[];
    const results: ImportResult[] = [];

    for (const item of items) {
      try {
        // Check if item already exists for this user
        const existingItem = await client.fetch(
          `*[_type == "item" && name == $name && user._ref == $userId][0]`,
          { name: item.name, userId: session.user.id },
        );

        if (existingItem) {
          results.push({
            success: false,
            name: item.name,
            error: "Item already exists in your inventory",
            id: existingItem._id,
          });
          continue;
        }

        let categoryRef = null;

        if (item.category) {
          const categoryName = item.category.trim();

          let category = await client.fetch<SanityCategory>(
            `*[_type == "category" && title == $name][0]`,
            { name: categoryName },
          );

          if (!category) {
            category = await client.create({
              _type: "category",
              title: categoryName,
              slug: {
                _type: "slug",
                current: categoryName.toLowerCase().replace(/\s+/g, "-"),
              },
            });
          }

          categoryRef = {
            _type: "reference",
            _ref: category._id,
          };
        }

        // Handle image upload if URL exists
        let imageAsset;
        if (item.image_url) {
          try {
            console.log("Fetching image from:", item.image_url);

            // Fetch the image
            const imageResponse = await fetch(item.image_url);
            if (!imageResponse.ok) throw new Error("Failed to fetch image");

            const imageBuffer = await imageResponse.arrayBuffer();

            // Upload to Sanity
            imageAsset = await client.assets.upload(
              "image",
              Buffer.from(imageBuffer),
              {
                filename: `${item.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
              },
            );

            console.log("Uploaded image:", imageAsset);
          } catch (error) {
            console.error("Error uploading image:", error);
          }
        }

        const newItem = {
          _type: "item",
          name: item.name,
          slug: {
            _type: "slug",
            current: item.name.toLowerCase().replace(/\s+/g, "-").slice(0, 200),
          },
          size: item.size,
          weight: item.weight
            ? {
                weight: Number(item.weight),
                unit: item.weight_unit || "g",
              }
            : undefined,
          calories: item.calories ? Number(item.calories) : undefined,
          category: categoryRef,
          user: {
            _type: "reference",
            _ref: session.user.id,
          },
          ...(imageAsset && {
            image: {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: imageAsset._id,
              },
            },
          }),
        };

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

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process items" },
      { status: 500 },
    );
  }
}
