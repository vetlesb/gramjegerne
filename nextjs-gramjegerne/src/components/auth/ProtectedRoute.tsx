'use client';

import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({children}: ProtectedRouteProps) {
  const {data: session, status} = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' && !hasRedirected) {
      setHasRedirected(true);
      router.replace('/auth/signin');
    }
  }, [status, router, hasRedirected]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8 text-accent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
