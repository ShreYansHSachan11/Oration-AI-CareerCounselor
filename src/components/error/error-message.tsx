'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Shield,
  Server,
  Bug,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ErrorType =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'rate-limit'
  | 'server'
  | 'validation'
  | 'ai-service'
  | 'unknown';

export interface ErrorMessageProps {
  type: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  showDetails?: boolean;
  className?: string;
  variant?: 'inline' | 'toast' | 'modal' | 'banner';
  autoRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

const errorConfig: Record<
  ErrorType,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultMessage: string;
    color: string;
    canRetry: boolean;
  }
> = {
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection Problem',
    defaultMessage:
      'Unable to connect to the server. Please check your internet connection.',
    color: 'text-orange-500',
    canRetry: true,
  },
  timeout: {
    icon: Clock,
    defaultTitle: 'Request Timeout',
    defaultMessage: 'The request took too long to complete. Please try again.',
    color: 'text-yellow-500',
    canRetry: true,
  },
  unauthorized: {
    icon: Shield,
    defaultTitle: 'Authentication Required',
    defaultMessage: 'You need to sign in to access this feature.',
    color: 'text-red-500',
    canRetry: false,
  },
  forbidden: {
    icon: Shield,
    defaultTitle: 'Access Denied',
    defaultMessage: "You don't have permission to perform this action.",
    color: 'text-red-500',
    canRetry: false,
  },
  'not-found': {
    icon: AlertTriangle,
    defaultTitle: 'Not Found',
    defaultMessage: 'The requested resource could not be found.',
    color: 'text-amber-500',
    canRetry: false,
  },
  'rate-limit': {
    icon: Clock,
    defaultTitle: 'Too Many Requests',
    defaultMessage:
      "You're sending requests too quickly. Please wait a moment and try again.",
    color: 'text-orange-500',
    canRetry: true,
  },
  server: {
    icon: Server,
    defaultTitle: 'Server Error',
    defaultMessage: "Something went wrong on our end. We're working to fix it.",
    color: 'text-red-500',
    canRetry: true,
  },
  validation: {
    icon: AlertTriangle,
    defaultTitle: 'Invalid Input',
    defaultMessage: 'Please check your input and try again.',
    color: 'text-amber-500',
    canRetry: false,
  },
  'ai-service': {
    icon: Bug,
    defaultTitle: 'AI Service Unavailable',
    defaultMessage:
      'The AI service is temporarily unavailable. Please try again in a moment.',
    color: 'text-purple-500',
    canRetry: true,
  },
  unknown: {
    icon: AlertTriangle,
    defaultTitle: 'Unexpected Error',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    color: 'text-red-500',
    canRetry: true,
  },
};

export function ErrorMessage({
  type,
  title,
  message,
  details,
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  isRetrying = false,
  showDetails = false,
  className,
  variant = 'inline',
  autoRetry = false,
  retryCount = 0,
  maxRetries = 3,
}: ErrorMessageProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;
  const canRetry = config.canRetry && onRetry && retryCount < maxRetries;

  // Auto-retry logic
  React.useEffect(() => {
    if (autoRetry && canRetry && !isRetrying) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      const timeoutId = setTimeout(() => {
        onRetry?.();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [autoRetry, canRetry, isRetrying, onRetry, retryCount]);

  const baseClasses = cn(
    'flex items-start gap-3 p-4 rounded-lg border',
    {
      'bg-background border-border': variant === 'inline',
      'bg-background/95 backdrop-blur border-border shadow-lg':
        variant === 'toast',
      'bg-background border-border shadow-xl': variant === 'modal',
      'bg-muted/50 border-border': variant === 'banner',
    },
    className
  );

  const content = (
    <motion.div
      initial={{ opacity: 0, y: variant === 'toast' ? -20 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: variant === 'toast' ? -20 : 10 }}
      className={baseClasses}
    >
      <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{displayTitle}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {displayMessage}
            </p>

            {showDetails && details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32 text-muted-foreground">
                  {details}
                </pre>
              </details>
            )}

            {autoRetry && canRetry && (
              <p className="text-xs text-muted-foreground mt-2">
                Auto-retrying in{' '}
                {Math.ceil(
                  Math.min(1000 * Math.pow(2, retryCount), 10000) / 1000
                )}
                s... (Attempt {retryCount + 1}/{maxRetries})
              </p>
            )}
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {canRetry && (
          <div className="flex gap-2 mt-3">
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={cn('w-4 h-4', isRetrying && 'animate-spin')}
              />
              {isRetrying ? 'Retrying...' : retryLabel}
            </Button>

            {retryCount > 0 && (
              <span className="text-xs text-muted-foreground self-center">
                Retry {retryCount}/{maxRetries}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (variant === 'toast') {
    return <div className="fixed top-4 right-4 z-50 max-w-sm">{content}</div>;
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-md">{content}</div>
      </div>
    );
  }

  return content;
}

// Specialized error components
export function NetworkError({
  onRetry,
  ...props
}: Omit<ErrorMessageProps, 'type'>) {
  return <ErrorMessage type="network" onRetry={onRetry} autoRetry {...props} />;
}

export function AIServiceError({
  onRetry,
  ...props
}: Omit<ErrorMessageProps, 'type'>) {
  return (
    <ErrorMessage
      type="ai-service"
      onRetry={onRetry}
      autoRetry
      message="The AI service is temporarily unavailable. Your message has been saved and we'll try again automatically."
      {...props}
    />
  );
}

export function AuthError({ ...props }: Omit<ErrorMessageProps, 'type'>) {
  return (
    <ErrorMessage
      type="unauthorized"
      message="Please sign in to continue using the chat."
      {...props}
    />
  );
}

export function RateLimitError({
  onRetry,
  ...props
}: Omit<ErrorMessageProps, 'type'>) {
  return (
    <ErrorMessage
      type="rate-limit"
      onRetry={onRetry}
      autoRetry
      message="You're sending messages too quickly. Please wait a moment before trying again."
      {...props}
    />
  );
}

// Error message container for managing multiple errors
export function ErrorContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
}

// Hook for managing error states
export function useErrorHandler() {
  const [errors, setErrors] = React.useState<
    Array<{
      id: string;
      type: ErrorType;
      title?: string;
      message?: string;
      details?: string;
      timestamp: number;
      retryCount: number;
    }>
  >([]);

  const addError = React.useCallback(
    (
      type: ErrorType,
      options?: {
        title?: string;
        message?: string;
        details?: string;
        id?: string;
      }
    ) => {
      const id =
        options?.id ||
        `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setErrors(prev => [
        ...prev.filter(e => e.id !== id), // Remove existing error with same ID
        {
          id,
          type,
          title: options?.title,
          message: options?.message,
          details: options?.details,
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      return id;
    },
    []
  );

  const removeError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const incrementRetryCount = React.useCallback((id: string) => {
    setErrors(prev =>
      prev.map(e => (e.id === id ? { ...e, retryCount: e.retryCount + 1 } : e))
    );
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    removeError,
    incrementRetryCount,
    clearErrors,
  };
}
