'use client';
import {client} from '@/sanity/client';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {notFound} from 'next/navigation';
import {useParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {Item} from '@/types/list';
import SharePageClient from './SharePageClient';

// Define the type for the fetched list
interface FetchedList {
  _id: string;
  name: string;
  days?: number;
  weight?: number;
  participants?: number;
  image?: SanityImageSource;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    _key: string;
    _type: string;
    onBody?: boolean;
    checked?: boolean;
    quantity?: number;
    item: Item | null;
  }>;
}

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [list, setList] = useState<FetchedList | null>(null);

  useEffect(() => {
    async function fetchList() {
      try {
        const fetchedList = await client.fetch(
          `*[_type == "list" && slug.current == $slug][0]{
            _id,
            name,
            days,
            weight,
            participants,
            image,
            "user": user->{
              _id,
              name,
              email
            },
            "items": items[] {
              _key,
              _type,
              onBody,
              checked,
              quantity,
              "categoryOverride": categoryOverride->{
                _id,
                title
              },
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
          {slug},
        );

        if (!fetchedList) {
          notFound();
        }

        setList(fetchedList);
      } catch (err) {
        console.error('Error fetching list:', err);
      }
    }

    fetchList();
  }, [slug]);

  if (!list) {
    return <div>Loading...</div>;
  }

  return <SharePageClient list={list} />;
}
