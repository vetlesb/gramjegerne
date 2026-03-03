'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Suspense} from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'Sign-in is misconfigured. Please try again later or contact support.',
  AccessDenied: 'Access was denied.',
  Verification: 'Verification failed. The sign-in link may have expired.',
  Default: 'Something went wrong during sign-in. Please try again.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') ?? 'Default';
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex flex-col justify-center min-h-screen items-center gap-6 px-4">
      <h1 className="signin-logo text-accent text-center">Gramjegerne</h1>
      <p className="text-center text-foreground/90 max-w-md">{message}</p>
      <Link
        href="/auth/signin"
        className="button-primary rounded-md px-6 py-2"
      >
        Try again
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-screen items-center">
          <p className="text-foreground/70">Loading…</p>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
