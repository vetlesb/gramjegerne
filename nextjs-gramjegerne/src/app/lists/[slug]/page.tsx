import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";

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

// Define the props type for the ListItemPage component
type ListItemPageProps = {
  params: {
    slug: string; // This should be the structure for params
  };
};

// Default export of the page component
export default async function ListItemPage({ params }: ListItemPageProps) {
  // Fetch the data based on slug
  const listData = await client.fetch(LIST_QUERY, { slug: params.slug });

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
