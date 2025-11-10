'use client';
import {useParams, redirect} from 'next/navigation';
import {useEffect} from 'react';

export default function SharePage() {
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    // Redirect to the unified list page with shared mode
    if (slug) {
      redirect(`/lists/${slug}?shared=true`);
      }
  }, [slug]);

  return <div>Redirecting...</div>;
}
