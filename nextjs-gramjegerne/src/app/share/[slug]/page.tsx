'use client';

import {notFound} from 'next/navigation';
import SharePageClient from './SharePageClient';
import {useParams} from 'next/navigation';
import {useState, useEffect} from 'react';
import {Item} from '@/types/list';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {createClient} from 'next-sanity';

// Create a public client without authentication
const publicClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-03-19',
  useCdn: true,
  token: undefined, // Explicitly set no token
});

const builder = imageUrlBuilder(publicClient);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Add type for transformed list
type TransformedList = {
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
    item:
      | (Item & {
          image?: {
            url: string;
            asset: SanityImageSource;
          };
        })
      | null;
  }>;
};

// Add type for the fetched item
type FetchedItem = {
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
};

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [list, setList] = useState<TransformedList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchList() {
      try {
        const fetchedList = await publicClient.fetch(
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

        // Transform the image URLs before setting the state
        const transformedList: TransformedList = {
          ...fetchedList,
          items: fetchedList.items.map((item: FetchedItem) => ({
            ...item,
            item: item.item
              ? {
                  ...item.item,
                  image: item.item.image
                    ? {
                        asset: item.item.image,
                        url: urlFor(item.item.image).url(),
                      }
                    : null,
                }
              : null,
          })),
        };

        setList(transformedList);
      } catch (err) {
        console.error('Error fetching list:', err);
        setError('Failed to load list');
      }
    }

    fetchList();
  }, [slug]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!list) {
    return <div>Loading...</div>;
  }

  return <SharePageClient list={list} />;
}
