import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('StorefrontError', () => {
  it('reports the error and renders fallback UI', async () => {
    const reset = vi.fn();
    const error = Object.assign(new Error('Storefront exploded'), { digest: 'xyz789' });
    const { default: StorefrontError } = await import('./error');

    render(<StorefrontError error={error} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error ID: xyz789')).toBeInTheDocument();

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(error);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
