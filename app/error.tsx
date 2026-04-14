'use client';

import { useEffect } from 'react';
import { Hexagon, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
        <Hexagon size={40} strokeWidth={1} style={{ color: 'var(--accent2)', margin: '0 auto 1.5rem', display: 'block' }} />
        <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
          500
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '2rem' }}>
          An unexpected error occurred. Try refreshing — if it keeps happening, contact your instructor.
        </p>
        {error.digest && (
          <p style={{ fontSize: '11px', color: 'var(--text4)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Try again
          </button>
          <a href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1.25rem',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text2)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            ← Go home
          </a>
        </div>
      </div>
    </div>
  );
}
