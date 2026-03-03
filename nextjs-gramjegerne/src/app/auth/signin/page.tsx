'use client';

import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {signIn, useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {toast} from 'sonner';

export default function SignIn() {
  const {status} = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    signIn('google', {callbackUrl: '/'})
      .then((result) => {
        // If there's an error, signIn doesn't redirect – show feedback
        if (result?.error) {
          setIsSigningIn(false);
          const message =
            result.error === 'Configuration'
              ? 'Sign-in is misconfigured. Please try again later or contact support.'
              : result.error === 'AccessDenied'
                ? 'Access denied.'
                : 'Sign-in failed. Please try again.';
          toast.error(message);
        }
      })
      .catch(() => {
        setIsSigningIn(false);
        toast.error('Something went wrong. Please try again.');
      });
  };

  // If already authenticated, redirect to home
  if (status === 'authenticated') {
    router.push('/');
    return null;
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center">
        <LoadingSpinner className="w-8 h-8 text-accent" />
      </div>
    );
  }

  // Show sign in form
  return (
    <div className="flex justify-center min-h-screen items-center">
      <div className="w-full space-y-8">
        <h2 className="signin-logo text-accent text-center">Gramjegerne</h2>
        <h2 className="signin-logo-bot text-accent text-center">Gramjegerne</h2>
        <div className="flex flex-col justify-center items-center ingress">
          Your digital backpack for hiking gear
        </div>
        <div className="flex flex-col justify-center items-center">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="button-primary group flex justify-center items-center gap-3 rounded-md disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSigningIn ? (
              <LoadingSpinner className="w-5 h-5 text-current" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isSigningIn ? 'Signing in…' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
