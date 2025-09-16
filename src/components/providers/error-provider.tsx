'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { ErrorMessage, ErrorContainer } from '@/components/error/error-message';
import { NetworkStatus } from '@/components/error/network-status';
import { useErrorHandling, type ErrorState } from '@/hooks/use-error-handling';
import { AnimatePresence } from 'framer-motion';

interface ErrorContextType {
  errors: ErrorState[];
  addError: (error: unknown, errorId?: string) => string;
  removeError: (errorId: string) => void;
  retryError: (errorId: string, retryFn?: () => Promise<void> | void) => void;
  clearErrors: () => void;
  clearError: (errorId: string) => void;
  hasErrors: boolean;
  hasRetryableErrors: boolean;
  latestError?: ErrorState;
  isOnline: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

interface ErrorProviderProps {
  children: React.ReactNode;
  showToasts?: boolean;
  showNetworkStatus?: boolean;
  maxToasts?: number;
  toastDuration?: number;
}

export function ErrorProvider({
  children,
  showToasts = true,
  showNetworkStatus = true,
  maxToasts = 3,
  toastDuration = 5000,
}: ErrorProviderProps) {
  const [toastErrors, setToastErrors] = useState<ErrorState[]>([]);

  const errorHandling = useErrorHandling({
    maxRetries: 3,
    onError: error => {
      // Add to toast queue if toasts are enabled
      if (showToasts) {
        setToastErrors(prev => {
          const newToasts = [...prev, error].slice(-maxToasts);
          return newToasts;
        });

        // Auto-remove toast after duration
        setTimeout(() => {
          setToastErrors(prev => prev.filter(e => e.id !== error.id));
        }, toastDuration);
      }

      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error occurred:', error);
      }
    },
    onRetry: errorId => {
      console.log('Retrying error:', errorId);
    },
    onMaxRetriesReached: error => {
      console.error('Max retries reached for error:', error);
    },
  });

  const removeToastError = useCallback((errorId: string) => {
    setToastErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const contextValue: ErrorContextType = {
    ...errorHandling,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}

      {/* Network Status Indicator */}
      {showNetworkStatus && (
        <NetworkStatus onRetry={() => window.location.reload()} />
      )}

      {/* Toast Error Messages */}
      {showToasts && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          <AnimatePresence mode="popLayout">
            {toastErrors.map(error => (
              <ErrorMessage
                key={error.id}
                type={error.type}
                title={error.title}
                message={error.message}
                details={error.details}
                variant="toast"
                onRetry={
                  error.canRetry
                    ? () => errorHandling.retryError(error.id)
                    : undefined
                }
                onDismiss={() => removeToastError(error.id)}
                retryCount={error.retryCount}
                maxRetries={3}
                showDetails={process.env.NODE_ENV === 'development'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

// Hook for adding errors with context
export function useAddError() {
  const { addError } = useErrorContext();
  return addError;
}

// Hook for handling API errors specifically
export function useAPIErrorHandler() {
  const { addError, isOnline } = useErrorContext();

  const handleAPIError = useCallback(
    (error: unknown, context?: string) => {
      const errorId = addError(error);

      // Additional logging for API errors
      if (process.env.NODE_ENV === 'development') {
        console.group(`API Error${context ? ` (${context})` : ''}`);
        console.error('Error:', error);
        console.error('Error ID:', errorId);
        console.error('Online status:', isOnline);
        console.groupEnd();
      }

      return errorId;
    },
    [addError, isOnline]
  );

  return { handleAPIError, isOnline };
}

// Hook for handling form errors
export function useFormErrorHandler() {
  const { addError } = useErrorContext();

  const handleFormError = useCallback(
    (error: unknown, fieldName?: string) => {
      // Parse validation errors specifically
      if (error instanceof Error && error.message.includes('validation')) {
        return addError(error, `form-${fieldName || 'general'}`);
      }

      return addError(error, `form-${fieldName || 'general'}`);
    },
    [addError]
  );

  return { handleFormError };
}

// Component for displaying inline errors
export function InlineErrorDisplay({
  errorId,
  className,
}: {
  errorId?: string;
  className?: string;
}) {
  const { errors, retryError, removeError } = useErrorContext();

  const error = errorId ? errors.find(e => e.id === errorId) : undefined;

  if (!error) return null;

  return (
    <ErrorMessage
      type={error.type}
      title={error.title}
      message={error.message}
      details={error.details}
      variant="inline"
      className={className}
      onRetry={error.canRetry ? () => retryError(error.id) : undefined}
      onDismiss={() => removeError(error.id)}
      retryCount={error.retryCount}
      maxRetries={3}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  );
}

// Component for displaying all errors in a container
export function ErrorDisplayContainer({
  className,
  variant = 'inline',
  maxErrors = 5,
}: {
  className?: string;
  variant?: 'inline' | 'toast';
  maxErrors?: number;
}) {
  const { errors, retryError, removeError } = useErrorContext();

  const displayErrors = errors.slice(-maxErrors);

  if (displayErrors.length === 0) return null;

  return (
    <ErrorContainer className={className}>
      {displayErrors.map(error => (
        <ErrorMessage
          key={error.id}
          type={error.type}
          title={error.title}
          message={error.message}
          details={error.details}
          variant={variant}
          onRetry={error.canRetry ? () => retryError(error.id) : undefined}
          onDismiss={() => removeError(error.id)}
          retryCount={error.retryCount}
          maxRetries={3}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      ))}
    </ErrorContainer>
  );
}

// Higher-order component for wrapping components with error handling
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  return function WrappedComponent(props: P) {
    const { addError } = useErrorContext();
    const [componentError, setComponentError] = useState<Error | null>(null);

    const retry = useCallback(() => {
      setComponentError(null);
    }, []);

    if (componentError) {
      if (errorFallback) {
        const FallbackComponent = errorFallback;
        return <FallbackComponent error={componentError} retry={retry} />;
      }

      return (
        <ErrorMessage
          type="unknown"
          title="Component Error"
          message="This component encountered an error."
          details={componentError.message}
          onRetry={retry}
          variant="inline"
        />
      );
    }

    try {
      return <Component {...props} />;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setComponentError(err);
      addError(err);
      return null;
    }
  };
}
