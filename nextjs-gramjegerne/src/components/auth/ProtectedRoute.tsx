'use client';

import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {useSession} from 'next-auth/react';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({children}: ProtectedRouteProps) {
  const {data: session, status} = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' && !navigator.onLine,
  );
  const isLoading = status === 'loading';
  const showLoader = useDelayedLoader(isLoading, 300);

  const pathname = usePathname();

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // Helper function to check if current URL is a public share
  const checkIsPublicShare = () => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    return pathname.startsWith('/share') ||
      (pathname.startsWith('/lists/') && searchParams.get('shared') === 'true') ||
      (pathname === '/maps' && searchParams.get('share'));
  };

  useEffect(() => {
    // Don't do anything while loading or if already redirected
    if (hasRedirected) return;

    // When offline + on a route that requires Sanity (gear, lists, trips),
    // bounce to the offline page so the user gets the bundle list rather
    // than an infinite loader.
    if (isOffline && status === 'unauthenticated') {
      const offlineCapable =
        pathname.startsWith('/maps') ||
        pathname.startsWith('/share') ||
        pathname === '/offline.html';
      if (!offlineCapable) {
        setHasRedirected(true);
        window.location.replace('/offline.html');
      }
      return;
    }

    if (status !== 'unauthenticated') return;

    // Check if this is a public share - don't redirect if it is
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const isPublicShare =
      pathname.startsWith('/share') ||
      (pathname.startsWith('/lists/') && searchParams.get('shared') === 'true') ||
      (pathname === '/maps' && searchParams.get('share'));

    // Only redirect if NOT a public share
    if (!isPublicShare) {
      setHasRedirected(true);
      router.replace('/auth/signin');
    }
  }, [status, router, hasRedirected, pathname, isOffline]);

  if (showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8 text-accent" />
      </div>
    );
  }

  // Still loading but not showing spinner yet - show nothing
  if (isLoading) {
    return null;
  }

  // Allow public share links without session
  if (!session) {
    const isPublicShare = checkIsPublicShare();

    if (!isPublicShare && !isOffline) {
      return null;
    }
  }

  return <>{children}</>;
}
