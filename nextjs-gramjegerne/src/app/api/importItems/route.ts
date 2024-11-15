import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

export async function POST(request: Request) {
  try {
    const items = (await request.json()) as ImportItem[];
    console.log("Received items:", JSON.stringify(items, null, 2));
    const results: ImportResult[] = [];

    for (const item of items) {
      try {
        console.log("Processing item:", item);

        // Check if item already exists
        const existingItem = await client.fetch(
          `*[_type == "item" && name == $name][0]`,
          { name: item.name },
        );

        if (existingItem) {
          results.push({
            success: false,
            name: item.name,
            error: "Item already exists in the database",
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

        console.log("Creating item with data:", newItem);

        const createdItem = await client.create(newItem);
        console.log("Created item:", createdItem);

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
            error instanceof Error
              ? `Error: ${error.message}`
              : "Unknown error occurred",
        });
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
