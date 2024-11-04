import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client);

// Function to generate the URL for images
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// GROQ query to fetch the list data based on slug
const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

type Params = Promise<{ slug: string[] }>;

export default async function ListItemPage({ params }: { params: Params }) {
  // Await the params to get the slug
  const { slug } = await params;

  // Fetch the data based on slug
  const listData = await client.fetch(LIST_QUERY, { slug });

  // Check if the listData exists
  if (!listData) {
    return <div>List not found</div>; // Render this if data is not found
  }

  // Render the JSX to display the list details
  return (
    <div className="container mx-auto min-h-screen p-8">
      <h1 className="text-2xl font-bold">{listData.name}</h1>
      {listData.image && (
        <img src={urlFor(listData.image).url()} alt={listData.name} />
      )}
      <p>Days: {listData.days}</p>
      <p>Weight: {listData.weight} kg</p>
      <p>Participants: {listData.participants}</p>
    </div>
  );
}
