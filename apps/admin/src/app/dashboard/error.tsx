'use client';

import { useEffect } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function ErrorContent({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mb-8 max-w-md text-center text-gray-400">
        An unexpected error occurred in the dashboard. This has been logged automatically.
      </p>
      {error.message && (
        <pre className="mb-8 max-w-2xl overflow-x-auto rounded bg-gray-800 p-4 text-sm text-red-300">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-[#E8540A] px-6 py-3 font-medium text-white transition-colors hover:bg-[#c94607]"
      >
        Try Again
      </button>
    </div>
  );
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return <ErrorContent error={error} reset={reset} />;
}
