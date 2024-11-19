"use client";

import { client } from "@/sanity/client";
import { notFound } from "next/navigation";
import SharePageClient from "./SharePageClient";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { List } from "@/types/list";

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [list, setList] = useState<List | null>(null);

  useEffect(() => {
    async function fetchList() {
      const fetchedList = await client.fetch(
        `*[_type == "list" && slug.current == $slug][0]{
          _id,
          name,
          days,
          weight,
          participants,
          image,
          "items": items[] {
            _key,
            _type,
            quantity,
            "item": item->{
              _id,
              name,
              weight,
              image,
              calories,
              size,
              "category": category->{
                _id,
                title
              }
            }
          }
        }`,
        { slug },
      );

      if (!fetchedList) {
        notFound();
      }

      setList(fetchedList);
    }

    fetchList();
  }, [slug]);

  if (!list) {
    return <div>Loading...</div>;
  }

  return <SharePageClient list={list} />;
}
