import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Recoding — Exercise Platform',
  description: 'A controlled environment for completing recoding exercises',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var saved = localStorage.getItem('theme');
            var system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', saved || system);
          })();
        `}} />
      </head>
      <body>
        {children}
        <Toaster
          theme="system"
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
