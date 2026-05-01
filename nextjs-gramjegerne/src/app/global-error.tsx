'use client';

import {useEffect} from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '2rem 1.25rem',
          background: '#1f261c',
          color: '#eaffe2',
          fontFamily: '-apple-system, system-ui, sans-serif',
          minHeight: '100vh',
        }}
      >
        <h1 style={{color: '#b4ed9f', margin: '0 0 1rem 0', fontWeight: 500}}>
          Something went wrong
        </h1>
        <p style={{color: 'rgba(234,255,226,0.7)', marginTop: 0}}>
          The app crashed during render. The message below tells us what happened — please share it.
        </p>
        <pre
          style={{
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.8rem',
            margin: '1rem 0',
          }}
        >
          {error?.name ? `${error.name}: ` : ''}
          {error?.message || 'no message'}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>
        {error?.stack && (
          <details style={{marginBottom: '1rem'}}>
            <summary style={{cursor: 'pointer', color: 'rgba(234,255,226,0.7)'}}>
              Stack trace
            </summary>
            <pre
              style={{
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px dashed rgba(255,255,255,0.15)',
                borderRadius: '0.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.7rem',
                marginTop: '0.5rem',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1rem',
              background: '#b4ed9f',
              color: '#1f261c',
              border: 0,
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.replace('/offline.html');
            }}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              color: '#eaffe2',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Offline page
          </button>
        </div>
      </body>
    </html>
  );
}
