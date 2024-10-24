import Link from "next/link";
import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from '@sanity/image-url';
import { client } from "@/sanity/client";


// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client)

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
function urlFor(source) {
  return builder.image(source)
}

const ITEMS_QUERY = `*[
  _type == "item"
]{name, slug, image, category, size, weight, quantity, calories}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const items = await client.fetch<SanityDocument[]>(ITEMS_QUERY, {}, options);
console.log (items)
  return (
    <main className="container mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-xl font-bold mb-8">items</h1>
      <ul className="flex flex-col gap-y-4">
        {items.map((item) => (
          <li key={item._id}>
        
              <img src={urlFor(item.image).width(500).url()} />
              <h2 className="text-4xl font-semibold">{item.name}</h2>
              <p className="text-s">Category: {item.category.category}</p>
              <p className="text-s">Size: {item.size}</p>
              <p className="text-s">Quantity: {item.quantity}</p>
              <p className="text-s">Weight: {item.weight.weight} {item.weight.unit}</p>
              <p className="text-s">Slug: {item.slug.slug}</p>
            
              
   
     
          </li>
        ))}
      </ul>
    </main>
  );
}