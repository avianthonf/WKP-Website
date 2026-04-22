'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function ErrorContent({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error);
    }

    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--cream)] px-4 text-[var(--ink)]">
      <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mb-4 max-w-md text-center text-[var(--stone)]">
        An unexpected error occurred in the dashboard. This has been logged automatically.
      </p>
      <p className="mb-8 text-sm text-[var(--stone)]">
        Error ID: {error.digest || 'internal-error'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--ember)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--ember-dark)]"
      >
        Try Again
      </button>
    </div>
  );
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return <ErrorContent error={error} reset={reset} />;
}