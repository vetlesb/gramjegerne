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
  const isLoading = status === 'loading';
  const showLoader = useDelayedLoader(isLoading, 300);

  const pathname = usePathname();
  
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
    if (status !== 'unauthenticated' || hasRedirected) return;
    
    // Check if this is a public share - don't redirect if it is
    const isPublicShare = checkIsPublicShare();
    
    // Only redirect if NOT a public share
    if (!isPublicShare) {
      setHasRedirected(true);
      router.replace('/auth/signin');
    }
  }, [status, router, hasRedirected, pathname]);

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
    
    if (!isPublicShare) {
      return null;
    }
  }

  return <>{children}</>;
}
