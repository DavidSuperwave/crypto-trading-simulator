import { useCallback } from 'react';

interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  showToast?: boolean;
  logToConsole?: boolean;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { onError, showToast = true, logToConsole = true } = options;

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    if (logToConsole) {
      console.error(`🚨 Error ${context ? `in ${context}` : ''}:`, errorObj);
    }

    // Call custom error handler if provided
    onError?.(errorObj);

    // Show toast notification if enabled
    if (showToast && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Error Occurred', {
        body: errorObj.message || 'An unexpected error occurred',
        icon: '/favicon.ico'
      });
    }

    return errorObj;
  }, [onError, showToast, logToConsole]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    fallbackValue?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context);
      return fallbackValue;
    }
  }, [handleError]);

  const wrapAsyncFunction = useCallback(<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context?: string,
    fallbackValue?: TReturn
  ) => {
    return async (...args: TArgs): Promise<TReturn | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return fallbackValue;
      }
    };
  }, [handleError]);

  const safeExecute = useCallback(<T>(
    fn: () => T,
    context?: string,
    fallbackValue?: T
  ): T | undefined => {
    try {
      return fn();
    } catch (error) {
      handleError(error as Error, context);
      return fallbackValue;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    wrapAsyncFunction,
    safeExecute
  };
};