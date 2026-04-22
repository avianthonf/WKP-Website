'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface StorefrontErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function ErrorContent({ error, reset }: StorefrontErrorProps) {
  useEffect(() => {
    console.error('Storefront error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--cream)] px-4 text-[var(--ink)]">
      <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
      <p className="mb-8 max-w-md text-center text-[var(--stone)]">
        We encountered an unexpected error. Our team has been notified.
      </p>
      {error.message && (
        <pre className="mb-8 max-w-2xl overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-white p-4 text-sm text-[var(--ink)] shadow-sm">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--ember)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--ember-dark)]"
      >
        Try Again
      </button>
    </div>
  );
}

export default function StorefrontError({ error, reset }: StorefrontErrorProps) {
  return <ErrorContent error={error} reset={reset} />;
}