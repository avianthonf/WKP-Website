import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'We Knead Pizza | Control Room',
  description: 'A Supabase-backed control room for menu, orders, staff, storefront content, and live operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#1A1712" />
      </head>
      <body className="admin-app antialiased">{children}</body>
    </html>
  );
}
