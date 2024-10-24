import Link from "next/link";
import { type SanityDocument } from "next-sanity";

import { client } from "@/sanity/client";

const ITEMS_QUERY = `*[
  _type == "item"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{name, image, category, size, weight, quantity, calories}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const items = await client.fetch<SanityDocument[]>(ITEMS_QUERY, {}, options);

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold mb-8">items</h1>
      <ul className="flex flex-col gap-y-4">
        {items.map((item) => (
          <li className="hover:underline" key={item._id}>
            <Link href={`/${item.slug.current}`}>
              <h2 className="text-xl font-semibold">{item.name}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}