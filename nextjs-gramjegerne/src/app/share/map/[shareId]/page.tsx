'use client';
import {client} from '@/sanity/client';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {notFound} from 'next/navigation';
import {useParams} from 'next/navigation';
import {useEffect, useState, Suspense} from 'react';
import {CampingSpot, Route} from '@/types';
import ShareMapClient from './ShareMapClient';

// Define the type for the fetched trip
interface FetchedTrip {
  _id: string;
  name: string;
  description?: string;
  image?: SanityImageSource;
  startDate?: string;
  endDate?: string;
  shareId?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  campingSpots: CampingSpot[];
  routes: Route[];
}

export default function ShareMapPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [trip, setTrip] = useState<FetchedTrip | null>(null);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const fetchedTrip = await client.fetch(
          `*[_type == "trip" && shareId == $shareId][0]{
            _id,
            name,
            description,
            image,
            startDate,
            endDate,
            shareId,
            "user": user->{
              _id,
              name,
              email
            },
            campingSpots[] {
              _key,
              name,
              description,
              category,
              coordinates,
              image
            },
            routes[] {
              _key,
              name,
              description,
              waypoints,
              color
            }
          }`,
          {shareId},
        );

        if (!fetchedTrip) {
          notFound();
        }

        setTrip(fetchedTrip);
      } catch (err) {
        console.error('Error fetching trip:', err);
      }
    }

    fetchTrip();
  }, [shareId]);

  if (!trip) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShareMapClient trip={trip} />
    </Suspense>
  );
}
