'use client';

import { useCallback, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { useNetworkStatus } from '@/components/error/network-status';
import type { ErrorType } from '@/components/error/error-message';

export interface ErrorState {
  id: string;
  type: ErrorType;
  title?: string;
  message: string;
  details?: string;
  timestamp: number;
  retryCount: number;
  canRetry: boolean;
}

export interface UseErrorHandlingOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ErrorState) => void;
  onRetry?: (errorId: string) => void;
  onMaxRetriesReached?: (error: ErrorState) => void;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const { isOnline } = useNetworkStatus();
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const parseError = useCallback(
    (error: unknown): Omit<ErrorState, 'id' | 'timestamp' | 'retryCount'> => {
      // Network offline
      if (!isOnline) {
        return {
          type: 'network',
          message:
            'No internet connection. Please check your network and try again.',
          canRetry: true,
        };
      }

      // tRPC errors
      if (error instanceof TRPCClientError) {
        const code = error.data?.code;
        const httpStatus = error.data?.httpStatus;

        switch (code) {
          case 'UNAUTHORIZED':
            return {
              type: 'unauthorized',
              title: 'Authentication Required',
              message: 'You need to sign in to continue.',
              canRetry: false,
            };

          case 'FORBIDDEN':
            return {
              type: 'forbidden',
              title: 'Access Denied',
              message: "You don't have permission to perform this action.",
              canRetry: false,
            };

          case 'NOT_FOUND':
            return {
              type: 'not-found',
              title: 'Not Found',
              message: 'The requested resource could not be found.',
              canRetry: false,
            };

          case 'TIMEOUT':
            return {
              type: 'timeout',
              title: 'Request Timeout',
              message:
                'The request took too long to complete. Please try again.',
              canRetry: true,
            };

          case 'TOO_MANY_REQUESTS':
            return {
              type: 'rate-limit',
              title: 'Too Many Requests',
              message:
                "You're sending requests too quickly. Please wait a moment and try again.",
              canRetry: true,
            };

          case 'INTERNAL_SERVER_ERROR':
            return {
              type: 'server',
              title: 'Server Error',
              message:
                "Something went wrong on our end. We're working to fix it.",
              details: error.message,
              canRetry: true,
            };

          case 'BAD_REQUEST':
            return {
              type: 'validation',
              title: 'Invalid Request',
              message:
                error.message || 'Please check your input and try again.',
              canRetry: false,
            };

          default:
            // Handle by HTTP status if no specific code
            if (httpStatus) {
              if (httpStatus >= 500) {
                return {
                  type: 'server',
                  title: 'Server Error',
                  message: 'Server error occurred. Please try again.',
                  details: error.message,
                  canRetry: true,
                };
              }
              if (httpStatus === 401) {
                return {
                  type: 'unauthorized',
                  title: 'Authentication Required',
                  message: 'You need to sign in to continue.',
                  canRetry: false,
                };
              }
              if (httpStatus === 403) {
                return {
                  type: 'forbidden',
                  title: 'Access Denied',
                  message: "You don't have permission to perform this action.",
                  canRetry: false,
                };
              }
              if (httpStatus === 404) {
                return {
                  type: 'not-found',
                  title: 'Not Found',
                  message: 'The requested resource could not be found.',
                  canRetry: false,
                };
              }
            }
        }
      }

      // Network/fetch errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('fetch') || message.includes('network')) {
          return {
            type: 'network',
            title: 'Connection Problem',
            message:
              'Unable to connect to the server. Please check your internet connection.',
            details: error.message,
            canRetry: true,
          };
        }

        if (message.includes('timeout')) {
          return {
            type: 'timeout',
            title: 'Request Timeout',
            message: 'The request took too long to complete. Please try again.',
            details: error.message,
            canRetry: true,
          };
        }

        if (message.includes('ai') || message.includes('openai')) {
          return {
            type: 'ai-service',
            title: 'AI Service Unavailable',
            message:
              'The AI service is temporarily unavailable. Please try again in a moment.',
            details: error.message,
            canRetry: true,
          };
        }
      }

      // Default error
      return {
        type: 'unknown',
        title: 'Unexpected Error',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
        details: error instanceof Error ? error.stack : String(error),
        canRetry: true,
      };
    },
    [isOnline]
  );

  const addError = useCallback(
    (error: unknown, errorId?: string): string => {
      const parsedError = parseError(error);
      const id =
        errorId ||
        `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const errorState: ErrorState = {
        id,
        ...parsedError,
        timestamp: Date.now(),
        retryCount: 0,
      };

      setErrors(prev => {
        // Remove existing error with same ID
        const filtered = prev.filter(e => e.id !== id);
        return [...filtered, errorState];
      });

      onError?.(errorState);
      return id;
    },
    [parseError, onError]
  );

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const retryError = useCallback(
    (errorId: string, retryFn?: () => Promise<void> | void) => {
      setErrors(prev =>
        prev.map(error => {
          if (error.id === errorId) {
            const newRetryCount = error.retryCount + 1;

            if (newRetryCount >= maxRetries) {
              onMaxRetriesReached?.(error);
              return { ...error, canRetry: false };
            }

            onRetry?.(errorId);

            // Execute retry function if provided
            if (retryFn) {
              setTimeout(
                () => {
                  try {
                    const result = retryFn();
                    if (result instanceof Promise) {
                      result.catch(err => {
                        // If retry fails, increment count again
                        addError(err, errorId);
                      });
                    }
                  } catch (err) {
                    addError(err, errorId);
                  }
                },
                retryDelay * Math.pow(2, newRetryCount - 1)
              ); // Exponential backoff
            }

            return { ...error, retryCount: newRetryCount };
          }
          return error;
        })
      );
    },
    [maxRetries, retryDelay, onRetry, onMaxRetriesReached, addError]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback(
    (errorId: string) => {
      removeError(errorId);
    },
    [removeError]
  );

  const hasErrors = errors.length > 0;
  const hasRetryableErrors = errors.some(e => e.canRetry);
  const latestError = errors[errors.length - 1];

  return {
    errors,
    hasErrors,
    hasRetryableErrors,
    latestError,
    addError,
    removeError,
    retryError,
    clearErrors,
    clearError,
    isOnline,
  };
}

// Hook for handling tRPC mutations with error handling
export function useTRPCMutationWithErrorHandling<TInput, TOutput>(
  mutation: any, // tRPC mutation
  options: UseErrorHandlingOptions & {
    onSuccess?: (data: TOutput) => void;
    onMutate?: (variables: TInput) => void;
  } = {}
) {
  const { onSuccess, onMutate, ...errorOptions } = options;
  const errorHandling = useErrorHandling(errorOptions);

  const mutate = useCallback(
    async (input: TInput) => {
      try {
        onMutate?.(input);
        const result = await mutation.mutateAsync(input);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorId = errorHandling.addError(error);
        throw { error, errorId };
      }
    },
    [mutation, onMutate, onSuccess, errorHandling]
  );

  const mutateWithRetry = useCallback(
    async (input: TInput, maxRetries = 3) => {
      let lastError: any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await mutate(input);
        } catch ({ error, errorId }) {
          lastError = error;

          if (attempt < maxRetries) {
            const parsedError = errorHandling.parseError?.(error);
            if (parsedError?.canRetry) {
              // Wait before retry with exponential backoff
              await new Promise(resolve =>
                setTimeout(resolve, 1000 * Math.pow(2, attempt))
              );
              continue;
            }
          }

          throw { error, errorId };
        }
      }

      throw lastError;
    },
    [mutate, errorHandling]
  );

  return {
    ...errorHandling,
    mutate,
    mutateWithRetry,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// Hook for handling tRPC queries with error handling
export function useTRPCQueryWithErrorHandling<TOutput>(
  query: any, // tRPC query
  options: UseErrorHandlingOptions & {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
  } = {}
) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    ...errorOptions
  } = options;
  const errorHandling = useErrorHandling(errorOptions);

  // Add error to state when query fails
  React.useEffect(() => {
    if (query.isError && query.error) {
      errorHandling.addError(query.error);
    }
  }, [query.isError, query.error, errorHandling]);

  // Auto-retry on network reconnection
  React.useEffect(() => {
    if (errorHandling.isOnline && refetchOnReconnect && query.isError) {
      query.refetch();
    }
  }, [errorHandling.isOnline, refetchOnReconnect, query]);

  const refetchWithErrorHandling = useCallback(async () => {
    try {
      errorHandling.clearErrors();
      return await query.refetch();
    } catch (error) {
      errorHandling.addError(error);
      throw error;
    }
  }, [query, errorHandling]);

  return {
    ...errorHandling,
    ...query,
    refetch: refetchWithErrorHandling,
  };
}

// Global error handler hook
export function useGlobalErrorHandler() {
  const errorHandling = useErrorHandling({
    maxRetries: 3,
    onError: error => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Global error:', error);
      }

      // In production, you might want to send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(new Error(error.message), {
        //   extra: error,
        // });
      }
    },
  });

  // Global error event listener
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      errorHandling.addError(event.error || new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandling.addError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [errorHandling]);

  return errorHandling;
}
