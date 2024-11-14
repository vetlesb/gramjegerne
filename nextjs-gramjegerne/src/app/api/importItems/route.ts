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

interface CategoryReference {
  _type: "reference";
  _ref: string;
  _key: string;
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

const generateKey = () => Math.random().toString(36).substr(2, 9);

export async function POST(request: Request) {
  try {
    const items = (await request.json()) as ImportItem[];
    const results: ImportResult[] = [];

    for (const item of items) {
      try {
        console.log("Processing item:", item);

        let categoryRefs: CategoryReference[] = [];

        if (item.category) {
          const categoryNames = item.category
            .split(",")
            .map((cat) => cat.trim());
          console.log("Category names to process:", categoryNames);

          // First, check which categories exist
          const existingCategories = await client.fetch<SanityCategory[]>(
            `*[_type == "category" && title in $names]{
              _id,
              title
            }`,
            { names: categoryNames },
          );

          console.log("Found existing categories:", existingCategories);

          // Find categories that need to be created
          const existingTitles = existingCategories.map((c) => c.title);
          const newCategoryNames = categoryNames.filter(
            (name) => !existingTitles.includes(name),
          );

          // Create new categories
          for (const categoryName of newCategoryNames) {
            try {
              console.log("Creating new category:", categoryName);
              const newCategory = await client.create({
                _type: "category",
                title: categoryName,
                slug: {
                  _type: "slug",
                  current: categoryName.toLowerCase().replace(/\s+/g, "-"),
                },
              });
              console.log("Created new category:", newCategory);
              existingCategories.push(newCategory);
            } catch (error) {
              console.error(`Error creating category ${categoryName}:`, error);
            }
          }

          // Create references for all categories (both existing and newly created)
          categoryRefs = existingCategories.map((category: SanityCategory) => ({
            _type: "reference",
            _ref: category._id,
            _key: generateKey(),
          }));

          console.log("Final category references:", categoryRefs);
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
          categories: categoryRefs,
          // Add image reference if upload was successful
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
          error: error instanceof Error ? error.message : "Unknown error",
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
