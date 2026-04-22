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

/**
 * Higher-Order Function to observe and log Server Actions.
 * Integrates with Sentry and Pino for comprehensive observability.
 * 
 * @param actionName - Descriptive name for the action (e.g., 'createTopping')
 * @param action - The async function to execute
 * @returns The result of the action
 * 
 * WARNING: Do not include PII or sensitive data in logs. 
 * Be cautious when logging full formData or user-provided objects.
 */
export async function withObservedAction<T>(
  actionName: string,
  action: () => Promise<T>
): Promise<T> {
  return await withServerActionInstrumentation(actionName, {
    recordResponse: true,
  }, async () => {
    const startTime = Date.now();
    logger.info({ action: actionName }, `Action started: ${actionName}`);

    try {
      const result = await action();
      const duration = Date.now() - startTime;
      
      logger.info(
        { 
          action: actionName, 
          duration, 
          success: true 
        }, 
        `Action completed: ${actionName} (${duration}ms)`
      );
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error(
        { 
          action: actionName, 
          duration, 
          success: false, 
          error: error.message || 'Unknown error' 
        }, 
        `Action failed: ${actionName} (${duration}ms)`
      );
      
      throw error;
    }
  });
}
