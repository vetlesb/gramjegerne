import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Define the types for Item and Category
interface Item {
  _id: string;
  name: string;
  image?: SanityImageSource;
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

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await params to ensure it's resolved
  const { slug } = await params;

  // Fetch the category with items
  const category: Category | null = await client.fetch(
    `*[_type == "category" && slug.current == $slug][0]{
      _id,
      title,
      "items": *[_type == "item" && category._ref == ^._id]{
        _id, name, image, size, weight, quantity, calories
      }
    }`,
    { slug },
  );

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
            {/* Additional item details */}
          </li>
        ))}
      </ul>
    </main>
  );
}
