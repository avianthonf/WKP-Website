'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <h1 className="mb-2 text-7xl font-bold text-[#E8540A] font-serif italic">404</h1>
      <h2 className="mb-4 text-xl font-medium">Page Not Found</h2>
      <p className="mb-8 max-w-md text-center text-gray-400">
        The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-[#E8540A] px-6 py-3 font-medium text-white transition-colors hover:bg-[#c94607]"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
}
