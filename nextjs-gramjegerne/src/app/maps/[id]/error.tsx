'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function TripPageError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Trip page error:', error);
  }, [error]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-primary text-white px-6 gap-4">
      <h1 className="text-2xl text-accent">Couldn&apos;t load this trip</h1>
      <p className="text-white/60 text-center max-w-md">
        Something went wrong while opening the map. If you&apos;re offline you may not have a saved
        copy of this trip on this device, or the page cache may be out of date.
      </p>
      <p className="text-white/40 text-xs font-mono break-all max-w-md text-center">
        {error.message || 'unknown error'}
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <button onClick={() => reset()} className="button-ghost px-4 py-2">
          Try again
        </button>
        <button onClick={() => router.push('/maps')} className="button-ghost px-4 py-2">
          All maps
        </button>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.replace('/offline.html');
          }}
          className="button-primary px-4 py-2"
        >
          Offline page
        </button>
      </div>
    </div>
  );
}
