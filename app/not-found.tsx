import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Hexagon size={40} strokeWidth={1} style={{ color: 'var(--accent2)', margin: '0 auto 1.5rem', display: 'block' }} />
        <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
          404
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>
          Page not found
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" style={{
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
        </Link>
      </div>
    </div>
  );
}
