import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Recoding — Exercise Platform',
  description: 'A controlled environment for completing recoding exercises',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
