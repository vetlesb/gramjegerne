// pages/lists/[slug].tsx
import { useRouter } from "next/router";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";
import { useEffect, useState } from "react";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client);

// Function to return the image builder with additional parameters
function urlFor(SanityImageSource: SanityImageSource) {
  return builder.image(SanityImageSource);
}

const LIST_QUERY = groq`*[_type == "list" && slug.current == $slug][0]{
  name,
  image,
  days,
  weight,
  participants
}`;

interface List {
  name: string;
  image: SanityImageSource;
  days: number;
  weight: number;
  participants: number;
}

export default function ListItemPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string }; // Make slug optional to avoid runtime error
  const [list, setList] = useState<List | null>(null); // State to hold the fetched list

  const fetchList = async (slug: string) => {
    const listData = await client.fetch(LIST_QUERY, { slug });
    return listData;
  };

  useEffect(() => {
    if (slug) {
      // Ensure slug is defined before fetching
      fetchList(slug).then((data) => {
        setList(data);
      });
    }
  }, [slug]);

  if (!list) return <div>Loading...</div>; // Loading state

  return (
    <div className="container mx-auto min-h-screen p-8">
      <h1 className="text-2xl font-bold">{list.name}</h1>
      <img src={urlFor(list.image).url()} alt={list.name} />
      <p>Days: {list.days}</p>
      <p>Weight: {list.weight}</p>
      <p>Participants: {list.participants}</p>
      {/* Add more details as needed */}
    </div>
  );
}
