import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";

// Sanity client with write permissions
const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-01-01",
});

async function downloadImage(url: string) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return buffer;
  } catch (error) {
    console.error("Error downloading image:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const items = await request.json();

    const results = [];

    for (const item of items) {
      try {
        // 1. Check/Create Category
        let category = await writeClient.fetch(
          `*[_type == "category" && title == $title][0]`,
          { title: item.category },
        );

        if (!category) {
          category = await writeClient.create({
            _type: "category",
            title: item.category,
            slug: {
              _type: "slug",
              current: item.category.toLowerCase().replace(/\s+/g, "-"),
            },
          });
        }

        // 2. Handle Image Upload
        let imageAsset = null;
        if (item.image_url) {
          const imageBuffer = await downloadImage(item.image_url);
          if (imageBuffer) {
            imageAsset = await writeClient.assets.upload(
              "image",
              Buffer.from(imageBuffer),
            );
          }
        }

        // 3. Create Item
        const newItem = await writeClient.create({
          _type: "item",
          name: item.name,
          slug: {
            _type: "slug",
            current: item.name.toLowerCase().replace(/\s+/g, "-"),
          },
          size: item.size || undefined,
          weight: item.weight
            ? {
                weight: parseFloat(item.weight),
                unit: item.weight_unit || "g",
              }
            : undefined,
          calories: item.calories ? parseInt(item.calories) : undefined,
          categories: [
            {
              _type: "reference",
              _ref: category._id,
            },
          ],
          ...(imageAsset && {
            image: {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: imageAsset._id,
              },
            },
          }),
        });

        results.push({
          success: true,
          name: item.name,
          id: newItem._id,
        });
      } catch (itemError) {
        results.push({
          success: false,
          name: item.name,
          error:
            itemError instanceof Error ? itemError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (importError) {
    console.error("Import failed:", importError);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
