import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const scanMock = vi.fn();

vi.mock('react-scan', () => ({
  scan: scanMock,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('ReactScan', () => {
  it('enables react-scan in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { ReactScan } = await import('./ReactScan');

    render(<ReactScan />);

    await waitFor(() => {
      expect(scanMock).toHaveBeenCalledWith({ enabled: true, log: true });
    });
  });

  it('does not enable react-scan outside development', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const { ReactScan } = await import('./ReactScan');

    render(<ReactScan />);

    await waitFor(() => {
      expect(scanMock).not.toHaveBeenCalled();
    });
  });
});
