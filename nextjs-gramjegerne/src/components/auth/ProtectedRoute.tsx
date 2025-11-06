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

  useEffect(() => {
    // Check if current route is a public share link
    const searchParams = new URLSearchParams(window.location.search);
    const isPublicShare = 
      pathname.startsWith('/share') || 
      (pathname.startsWith('/lists/') && searchParams.get('shared') === 'true');

    if (!isPublicShare && status === 'unauthenticated' && !hasRedirected) {
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
    const searchParams = new URLSearchParams(window.location.search);
    const isPublicShare = 
      pathname.startsWith('/share') || 
      (pathname.startsWith('/lists/') && searchParams.get('shared') === 'true');
    
    if (!isPublicShare) {
      return null;
    }
  }

  return <>{children}</>;
}
