import { useRouter } from "next/router";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { useEffect, useState } from "react";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";

// Get a pre-configured url-builder from your sanity client
const builder = imageUrlBuilder(client);

// Then we like to make a simple function like this that gives the
// builder an image and returns the builder for you to specify additional
// parameters:
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
  image: any; // Adjust type according to your image handling
  days: number;
  weight: number;
  participants: number;
}

export default function ListItemPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const [list, setList] = useState<List | null>(null);

  useEffect(() => {
    if (slug) {
      const fetchList = async () => {
        const listData = await client.fetch(LIST_QUERY, { slug });
        setList(listData);
      };

      fetchList();
    }
  }, [slug]);

  if (!list) return <div>Loading...</div>;

  return (
    <div className="container mx-auto min-h-screen p-8">
      <h1 className="text-2xl font-bold">{list.name}</h1>
      <img src={urlFor(list.image).url()} alt={list.name} />
      <p>Days: {list.days}</p>
      <p>Weight: {list.weight}</p>
      <p>Participants: {list.participants}</p>
    </div>
  );
}
