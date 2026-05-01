'use client';

import {useCallback, useEffect, useState, useRef} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import dynamicImport from 'next/dynamic';
import {Icon} from '@/components/Icon';
import type {MapDocument} from '@/types';
import type {TripMapRef} from '@/components/TripMap';

// Defer TripMap to client only (Leaflet hits window at module load).
const TripMap = dynamicImport(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-primary">
      <div className="text-white/50">Loading map…</div>
    </div>
  ),
});

export const dynamic = 'force-dynamic';

const TRIP_QUERY = groq`*[_type == "map" && _id == $tripId && user._ref == $userId][0] {
  _id,
  _type,
  name,
  slug,
  shareId,
  defaultTileLayer,
  campingSpots[] {
    _key,
    name,
    description,
    category,
    coordinates {lat, lng}
  },
  routes[] {
    _key,
    name,
    color,
    waypoints[] {lat, lng},
    elevationGain
  },
  user {_ref}
}`;

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const {data: session, status} = useSession();
  const tripId = decodeURIComponent(params.id as string);

  const [trip, setTrip] = useState<MapDocument | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'missing'>('loading');
  const [isOffline, setIsOffline] = useState(false);
  const mapRef = useRef<TripMapRef>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!tripId || tripId === '_warmup') {
      // _warmup is the placeholder shell precached by the SW. Don't try to
      // load that as if it were a real trip — params.id will update once
      // hydration resolves the real URL.
      return;
    }

    let cancelled = false;

    const tryBundle = async () => {
      try {
        const {getBundle} = await import('@/services/offlineMaps');
        const bundle = await getBundle(tripId);
        if (bundle && !cancelled) {
          setTrip(bundle.mapDocSnapshot);
          setIsOffline(true);
          setLoadState('loaded');
          return true;
        }
      } catch (err) {
        console.warn('Bundle lookup failed:', err);
      }
      return false;
    };

    const load = async () => {
      try {
        if (session?.user?.id) {
          try {
            const result = (await client.fetch(TRIP_QUERY, {
              tripId,
              userId: session.user.id,
            })) as MapDocument | null;
            if (cancelled) return;
            if (result) {
              setTrip(result);
              setIsOffline(false);
              setLoadState('loaded');
              return;
            }
          } catch {
            // Likely offline; fall through to bundle.
          }
        }
        if (cancelled) return;
        if (await tryBundle()) return;
        if (!cancelled) setLoadState('missing');
      } catch (err) {
        console.error('Trip load failed:', err);
        if (!cancelled) setLoadState('missing');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tripId, session?.user?.id, status]);

  const goBack = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/maps');
    }
  }, [router]);

  if (loadState === 'loading') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-primary text-white/50">
        Loading trip…
      </div>
    );
  }

  if (loadState === 'missing' || !trip) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-primary text-white px-6 gap-4">
        <h1 className="text-2xl text-accent">Trip not found</h1>
        <p className="text-white/60 text-center">
          We couldn&apos;t load this trip. If you&apos;re offline, you may not have saved a copy of
          this map on this device.
        </p>
        <p className="text-white/40 text-sm font-mono break-all">id: {tripId}</p>
        <div className="flex gap-2">
          <button onClick={goBack} className="button-ghost px-4 py-2">
            Back
          </button>
          <button
            onClick={() => router.push('/maps')}
            className="button-primary px-4 py-2"
          >
            All maps
          </button>
        </div>
      </div>
    );
  }

  const layerName = trip.defaultTileLayer || 'Kartverket Raster';

  return (
    <div className="w-full h-screen relative bg-primary">
      <div className="absolute top-0 left-0 right-0 z-[1001] flex items-center gap-3 p-4 bg-dimmed/80 backdrop-blur">
        <button
          onClick={goBack}
          className="button-ghost p-2"
          title="Back"
          aria-label="Back"
        >
          <Icon name="chevrondown" width={20} height={20} className="rotate-90" />
        </button>
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-lg lg:text-xl text-accent font-medium truncate">{trip.name}</h1>
          {isOffline && (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--bg-accent)]"
                aria-hidden
              />
              Offline copy
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-full">
        <TripMap
          ref={mapRef}
          campingSpots={trip.campingSpots ?? []}
          routes={trip.routes ?? []}
          defaultTileLayer={layerName}
          isReadOnly
          autoFitBounds
          showRoutes
          showCampSpots
          showFishingSpots
          showViewpointSpots
        />
      </div>
    </div>
  );
}
