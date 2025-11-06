'use client';
import {useParams, useRouter} from 'next/navigation';
import {useEffect} from 'react';

// Redirect to unified maps page
export default function TripViewRedirect() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  useEffect(() => {
    // Redirect to unified maps page
    router.push(`/maps?trip=${tripId}`);
  }, [router, tripId]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-primary">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
