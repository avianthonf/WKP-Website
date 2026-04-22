import { describe, expect, it, vi, beforeEach } from 'vitest';

const withServerActionInstrumentation = vi.fn(
  async (_name: string, _options: unknown, callback: () => Promise<unknown>) => callback()
);

vi.mock('@sentry/nextjs', () => ({
  withServerActionInstrumentation,
}));

vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(function () {
      return this;
    }),
    error: vi.fn(function () {
      return this;
    }),
  }),
}));

describe('withObservedAction', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('logs success for successful actions', async () => {
    const { withObservedAction, logger } = await import('../apps/admin/src/lib/observability');
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => logger);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    const result = await withObservedAction('testSuccess', async () => ({ success: true }));

    expect(result).toEqual({ success: true });
    expect(infoSpy).toHaveBeenCalledWith({ action: 'testSuccess' }, 'Action started: testSuccess');
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'testSuccess', success: true }),
      expect.stringContaining('Action completed: testSuccess')
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs returned error envelopes as failures', async () => {
    const { withObservedAction, logger } = await import('../apps/admin/src/lib/observability');
    vi.spyOn(logger, 'info').mockImplementation(() => logger);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    const result = await withObservedAction('testReturnedError', async () => ({ error: 'Invalid data' }));

    expect(result).toEqual({ error: 'Invalid data' });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'testReturnedError',
        success: false,
        error: 'Invalid data',
      }),
      expect.stringContaining('Action failed: testReturnedError')
    );
  });

  it('logs thrown exceptions as failures and rethrows them', async () => {
    const { withObservedAction, logger } = await import('../apps/admin/src/lib/observability');
    vi.spyOn(logger, 'info').mockImplementation(() => logger);
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const failure = new Error('Boom');

    await expect(withObservedAction('testThrownError', async () => {
      throw failure;
    })).rejects.toThrow('Boom');

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'testThrownError',
        success: false,
        error: 'Boom',
      }),
      expect.stringContaining('Action failed: testThrownError')
    );
  });
});
