import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recoding Exercise Platform',
  description: 'A controlled environment for completing recoding exercises',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
