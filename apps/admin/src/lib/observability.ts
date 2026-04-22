import { withServerActionInstrumentation } from '@sentry/nextjs';
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});

function sanitizeErrorMessage(error: string): string {
  return error
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]')
    .slice(0, 200);
}

function getReturnedError(result: unknown): string | null {
  if (!result || typeof result !== 'object' || !('error' in result)) {
    return null;
  }

  const error = result.error;
  return typeof error === 'string' && error.length > 0 ? sanitizeErrorMessage(error) : 'Unknown error';
}

export async function withObservedAction<T>(
  actionName: string,
  action: () => Promise<T>
): Promise<T> {
  return await withServerActionInstrumentation(
    actionName,
    {
      recordResponse: false,
    },
    async () => {
      const startTime = Date.now();
      logger.info({ action: actionName }, `Action started: ${actionName}`);

      try {
        const result = await action();
        const duration = Date.now() - startTime;
        const returnedError = getReturnedError(result);

        if (returnedError) {
          logger.error(
            {
              action: actionName,
              duration,
              success: false,
              error: returnedError,
            },
            `Action failed: ${actionName} (${duration}ms)`
          );

          return result;
        }

        logger.info(
          {
            action: actionName,
            duration,
            success: true,
          },
          `Action completed: ${actionName} (${duration}ms)`
        );

        return result;
      } catch (error: unknown) {
        const duration = Date.now() - startTime;

        logger.error(
          {
            action: actionName,
            duration,
            success: false,
            error: error instanceof Error ? sanitizeErrorMessage(error.message) : 'Unknown error',
          },
          `Action failed: ${actionName} (${duration}ms)`
        );

        throw error;
      }
    }
  );
}
