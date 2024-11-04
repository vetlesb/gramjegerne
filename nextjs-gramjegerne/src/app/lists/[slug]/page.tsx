// app/lists/[slug]/page.tsx

import { client } from "@/sanity/client"; // Your Sanity client
import { groq } from "next-sanity"; // GROQ for querying
import { SanityImageSource } from "@sanity/image-url/lib/types/types"; // Importing Sanity image types
import imageUrlBuilder from "@sanity/image-url"; // Import image URL builder

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

// Interface for the list
interface List {
  name: string;
  image: SanityImageSource; // Adjust type as needed
  days: number;
  weight: number;
  participants: number;
}

// Fetch data on the server
export default async function ListItemPage({
  params,
}: {
  params: { slug: string };
}) {
  console.log("Requested slug:", params.slug); // Log slug for debugging

  const listData = await client.fetch(LIST_QUERY, { slug: params.slug });

  // Log fetched data for debugging
  console.log("Fetched list data:", listData);

  if (!listData) {
    return <div>List not found</div>; // Handle not found case
  }

  return (
    <div className="container mx-auto min-h-screen p-8">
      <h1 className="text-2xl font-bold">{listData.name}</h1>
      <img src={urlFor(listData.image).url()} alt={listData.name} />
      <p>Days: {listData.days}</p>
      <p>Weight: {listData.weight}</p>
      <p>Participants: {listData.participants}</p>
    </div>
  );
}
