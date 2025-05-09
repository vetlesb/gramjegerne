'use client';

import {notFound} from 'next/navigation';
import SharePageClient from './SharePageClient';
import {useParams} from 'next/navigation';
import {useState, useEffect} from 'react';
import {client} from '@/sanity/client';
import {Item} from '@/types/list';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';

// Define the type for the fetched list
interface FetchedList {
  _id: string;
  name: string;
  days?: number;
  weight?: number;
  participants?: number;
  image?: SanityImageSource;
  items: Array<{
    _key: string;
    _type: string;
    onBody?: boolean;
    checked?: boolean;
    quantity?: number;
    item: Item | null;
  }>;
}

// Define the type for a fetched item
interface FetchedItem {
  _key: string;
  _type: string;
  onBody?: boolean;
  checked?: boolean;
  quantity?: number;
  item?: {
    _id: string;
    name: string;
    weight?: {
      weight: number;
      unit: string;
    };
    image?: SanityImageSource;
    calories?: number;
    size?: string;
    category?: {
      _id: string;
      title: string;
    };
  };
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

        // Transform the data to match the expected types
        const transformedList = {
          ...fetchedList,
          items: fetchedList.items.map((item: FetchedItem) => ({
            ...item,
            item: item.item || null,
          })),
        };

        setList(transformedList);
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
