import type { Metadata } from 'next';
import './globals.css';
import { ReactScan } from '@/components/diagnostics/ReactScan';

const isDevelopment = process.env.NODE_ENV === 'development';

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
        <meta name="theme-color" content="#F5F0E8" />
      </head>
      <body className="admin-app antialiased">
        {isDevelopment && <ReactScan />}
        {children}
      </body>
    </html>
  );
}
