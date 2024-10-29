import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from '@sanity/image-url';
import { client } from "@/sanity/client";



// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client)

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
function urlFor(ImageUrlBuilder:any) {
  return builder.image(ImageUrlBuilder)
}

const ITEMS_QUERY = `*[
  _type == "item"
]{name, slug, image, category, size, weight, quantity, calories}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const items = await client.fetch<SanityDocument[]>(ITEMS_QUERY, {}, options);
console.log (items)
  return (
    <main className="container mx-auto min-h-screen p-8">
    
      <ul className="flex flex-col">
        {items.map((item) => (
          <li className="product" key={item._id}>
              <div className="flex flex-wrap gap-x-4">
              <div className="h-24 w-24">
  <img className="rounded-md h-full w-full object-cover" src={urlFor(item.image).url()} />
</div>
              <div className="flex flex-col gap-x-4">
              <h2 className="text-2xl font-semibold">{item.name}</h2>
              <div className="flex flex-wrap gap-x-2">
              <p className="text-s tag w-fit">{item.category.category}</p>
              <p className="text-s tag w-fit flex flex-wrap">{item.size}</p>
              <p className="text-s tag w-fit">{item.weight.weight} {item.weight.unit}</p>
              <p className="text-s tag w-fit">{item.calories} kcal</p>
              </div>
              </div>
              </div>
          </li>
        ))}
      </ul>
    </main>
  );
}