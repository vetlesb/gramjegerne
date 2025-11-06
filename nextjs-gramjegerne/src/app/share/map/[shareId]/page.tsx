'use client';
import {useParams, redirect} from 'next/navigation';
import {useEffect} from 'react';

// Redirect to unified maps page
export default function ShareMapRedirect() {
  const params = useParams();
  const shareId = params.shareId as string;

  useEffect(() => {
    redirect(`/maps?share=${shareId}`);
  }, [shareId]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-primary">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
