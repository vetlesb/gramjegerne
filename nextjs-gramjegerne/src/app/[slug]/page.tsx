import { PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Link from "next/link";

const ITEM_QUERY = `*[_type == "item" && slug.current == $slug][0]`;

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? imageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const options = { next: { revalidate: 30 } };

export default async function ItemPage({
  params,
}: {
  params: { slug: string };
}) {
  const item = await client.fetch<SanityDocument>(ITEM_QUERY, params, options);
  const itemImageUrl = item.image
    ? urlFor(item.image)?.width(550).height(310).url()
    : null;

  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8 flex flex-col gap-4">
      <Link href="/" className="hover:underline">
        ← Back to posts
      </Link>
      {itemImageUrl && (
        <img
          src={itemImageUrl}
          alt={item.name}
          className="aspect-video rounded-xl"
          width="550"
          height="310"
        />
      )}
      <h1 className="text-4xl font-bold mb-8">{item.name}</h1>
      <div className="prose">
        {Array.isArray(item.body) && <PortableText value={item.body} />}
      </div>
    </main>
  );
}