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
import {getBundle} from '@/services/offlineMaps/bundleStore';

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

function readTripIdFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/maps\/([^/?#]+)/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const {data: session} = useSession();

  // Prefer the live URL over the params hook — when the SW serves a cached
  // /maps/_warmup shell at URL /maps/<real-id>, the params hook can hydrate
  // to "_warmup" while window.location reflects the real id.
  const [tripId, setTripId] = useState<string>(() => {
    const fromParams = (params?.id as string | undefined) ?? '';
    if (fromParams && fromParams !== '_warmup') {
      try {
        return decodeURIComponent(fromParams);
      } catch {
        return fromParams;
      }
    }
    return readTripIdFromUrl();
  });

  useEffect(() => {
    const fromUrl = readTripIdFromUrl();
    if (fromUrl && fromUrl !== tripId) setTripId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [trip, setTrip] = useState<MapDocument | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'missing'>('loading');
  const [loadStep, setLoadStep] = useState<string>('mounted');
  const [isOffline, setIsOffline] = useState(false);
  const mapRef = useRef<TripMapRef>(null);

  useEffect(() => {
    if (!tripId || tripId === '_warmup') {
      return;
    }

    let cancelled = false;
    setLoadStep('starting');

    const timeout = setTimeout(() => {
      if (!cancelled && trip === null) {
        console.warn('Trip load timed out at step:', loadStep);
        setLoadState('missing');
      }
    }, 6000);

    const load = async () => {
      try {
        setLoadStep('opening idb');
        const bundle = await getBundle(tripId);
        if (cancelled) return;
        setLoadStep('idb returned');
        if (bundle) {
          setTrip(bundle.mapDocSnapshot);
          setIsOffline(true);
          setLoadState('loaded');
          return;
        }
      } catch (err) {
        console.warn('Bundle lookup failed:', err);
        setLoadStep('idb error: ' + (err instanceof Error ? err.message : String(err)));
      }

      if (cancelled) return;

      if (session?.user?.id) {
        try {
          setLoadStep('fetching from sanity');
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
          setLoadStep('sanity returned null');
        } catch (err) {
          setLoadStep('sanity error: ' + (err instanceof Error ? err.message : 'unknown'));
        }
      } else {
        setLoadStep('no session, skipping sanity');
      }

      if (!cancelled) setLoadState('missing');
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, session?.user?.id]);

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
      <div className="w-full h-screen flex flex-col items-center justify-center bg-primary text-white/50 gap-2 px-6 text-center">
        <div>Loading trip…</div>
        <div className="text-xs text-white/30 font-mono">{loadStep}</div>
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
        <p className="text-white/30 text-xs font-mono break-all">last step: {loadStep}</p>
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
      <button
        onClick={goBack}
        className="absolute top-4 left-4 z-[1001] bg-dimmed/90 backdrop-blur rounded-lg p-3 hover:bg-dimmed-hover shadow-lg"
        title="Back"
        aria-label="Back"
      >
        <Icon name="chevrondown" width={20} height={20} className="rotate-90 text-white" />
      </button>

      {isOffline && (
        <div className="absolute top-4 right-4 z-[1001] bg-dimmed/90 backdrop-blur rounded-full px-3 py-1.5 shadow-lg inline-flex items-center gap-2 text-xs text-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--bg-accent)]" aria-hidden />
          Offline copy
        </div>
      )}

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
