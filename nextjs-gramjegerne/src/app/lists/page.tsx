import { type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client);

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
function urlFor(SanityImageSource: SanityImageSource) {
  return builder.image(SanityImageSource);
}

const LISTS_QUERY = `*[
  _type == "list"
]{name, image, days, weight}`;

const options = { next: { revalidate: 30 } };

export default async function IndexPage() {
  const lists = await client.fetch<SanityDocument[]>(LISTS_QUERY, {}, options);
  console.log(lists);
  return (
    <main className="container mx-auto min-h-screen p-8">
      <ul className="flex flex-col">
        {lists.map((list) => (
          <li className="product" key={list._id}>
            <div className="flex flex-wrap gap-x-4">
              <div className="h-48 w-48">
                <img
                  className="rounded-md h-full w-full object-cover"
                  src={urlFor(list.image).url()}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <h2 className="text-2xl font-semibold">{list.name}</h2>
                <div className="flex flex-wrap gap-x-2">
                  <p className="text-m tag w-fit flex flex-wrap">
                    {list.days} dager
                  </p>
                  <p className="text-m tag w-fit flex flex-wrap">
                    {list.weight} kg
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
