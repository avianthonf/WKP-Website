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

describe('DashboardError', () => {
  it('reports the error and renders fallback UI', async () => {
    const reset = vi.fn();
    const error = Object.assign(new Error('Dashboard exploded'), { digest: 'abc123' });
    const { default: DashboardError } = await import('./error');

    render(<DashboardError error={error} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error ID: abc123')).toBeInTheDocument();

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(error);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
