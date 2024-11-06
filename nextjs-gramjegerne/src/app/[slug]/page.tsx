// src/app/[slug]/page.tsx
import { client } from "@/sanity/client";
import { notFound } from "next/navigation";

// Define types for items and category
interface Item {
  _id: string;
  name: string;
  image?: string; // Adjust as needed
  size?: string;
  weight?: { weight: number; unit: string };
  quantity?: number;
  calories?: number;
}

interface Category {
  _id: string;
  title: string;
  items: Item[];
}

// Fetch category data
async function getCategoryData(slug: string): Promise<Category | null> {
  return await client.fetch(
    `*[_type == "category" && slug.current == $slug][0]{
      _id, 
      title, 
      "items": *[_type == "item" && references(^._id)]{
        _id, 
        name, 
        image, 
        size, 
        weight, 
        quantity, 
        calories
      }
    }`,
    { slug },
  );
}

// Synchronously generate static paths for categories
export async function generateStaticParams() {
  const categories = await client.fetch(`*[_type == "category"]{ slug }`);
  return categories.map((category: { slug: { current: string } }) => ({
    slug: category.slug.current,
  }));
}

// Component definition without additional params constraint
export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // Fetch the category and items associated with the slug
  const category = await getCategoryData(slug);

  // Handle 404 if category is not found
  if (!category) {
    return notFound();
  }

  return (
    <main className="container mx-auto min-h-screen p-16">
      <h1 className="text-2xl font-bold mb-8">{category.title}</h1>
      <ul className="flex flex-col gap-y-4">
        {category.items.map((item) => (
          <li key={item._id}>
            <h2>{item.name}</h2>
            {/* Display additional item details here, like image, size, etc. */}
          </li>
        ))}
      </ul>
    </main>
  );
}
