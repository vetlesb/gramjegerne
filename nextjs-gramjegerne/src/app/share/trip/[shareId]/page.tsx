'use client';
import {useParams, useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function ShareTripRedirect() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  useEffect(() => {
    router.replace(`/trips?share=${shareId}`);
  }, [router, shareId]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-primary">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
