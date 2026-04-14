'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

// global-error replaces the root layout when it crashes,
// so it must include <html> and <body>
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        background: '#050709',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 1.5rem', display: 'block' }}>
            <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          </svg>
          <div style={{ fontSize: '5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
            500
          </div>
          <p style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
            Critical error
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2rem' }}>
            The application encountered a fatal error. Please try refreshing.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', color: '#334155', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              background: '#6366f1',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </div>
      </body>
    </html>
  );
}
