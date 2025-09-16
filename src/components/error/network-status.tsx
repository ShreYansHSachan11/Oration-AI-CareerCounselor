'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  className?: string;
  showWhenOnline?: boolean;
  onRetry?: () => void;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Track that we were offline to show recovery message
      if (!isOnline) {
        setWasOffline(true);
        // Clear the "was offline" flag after showing recovery message
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

export function NetworkStatus({
  className,
  showWhenOnline = false,
  onRetry,
}: NetworkStatusProps) {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !showWhenOnline && !wasOffline) {
    return null;
  }

  return (
    <AnimatePresence>
      {(!isOnline || wasOffline) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium',
            isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
            className
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Connection restored</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>No internet connection</span>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 ml-2 text-white hover:bg-white/20"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Network-aware component wrapper
export function NetworkAware({
  children,
  fallback,
  onRetry,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              No Internet Connection
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please check your connection and try again.
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      )
    );
  }

  return <>{children}</>;
}

// Hook for network-aware API calls
export function useNetworkAwareQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    retryOnReconnect?: boolean;
    onError?: (error: Error) => void;
  }
) {
  const { isOnline } = useNetworkStatus();
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const enabled = options?.enabled !== false;
  const retryOnReconnect = options?.retryOnReconnect !== false;

  const executeQuery = React.useCallback(async () => {
    if (!isOnline || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, enabled, queryFn, options]);

  // Execute query when conditions are met
  React.useEffect(() => {
    if (isOnline && enabled) {
      executeQuery();
    }
  }, [isOnline, enabled, executeQuery]);

  // Retry when coming back online
  React.useEffect(() => {
    if (isOnline && retryOnReconnect && error && enabled) {
      executeQuery();
    }
  }, [isOnline, retryOnReconnect, error, enabled, executeQuery]);

  const retry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    error,
    isLoading,
    isOnline,
    retry,
    retryCount,
  };
}

// Network status indicator component
export function NetworkIndicator({ className }: { className?: string }) {
  const { isOnline } = useNetworkStatus();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      <span
        className={cn('text-xs', isOnline ? 'text-green-600' : 'text-red-600')}
      >
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

// Enhanced tRPC error handler that considers network status
export function useTRPCErrorHandler() {
  const { isOnline } = useNetworkStatus();

  const handleError = React.useCallback(
    (error: any) => {
      // Network-specific error handling
      if (!isOnline) {
        return {
          type: 'network' as const,
          message:
            'No internet connection. Please check your network and try again.',
          canRetry: true,
        };
      }

      // Parse tRPC errors
      if (error?.data?.code) {
        switch (error.data.code) {
          case 'UNAUTHORIZED':
            return {
              type: 'unauthorized' as const,
              message: 'You need to sign in to continue.',
              canRetry: false,
            };
          case 'FORBIDDEN':
            return {
              type: 'forbidden' as const,
              message: "You don't have permission to perform this action.",
              canRetry: false,
            };
          case 'NOT_FOUND':
            return {
              type: 'not-found' as const,
              message: 'The requested resource was not found.',
              canRetry: false,
            };
          case 'TIMEOUT':
            return {
              type: 'timeout' as const,
              message: 'The request timed out. Please try again.',
              canRetry: true,
            };
          case 'TOO_MANY_REQUESTS':
            return {
              type: 'rate-limit' as const,
              message: 'Too many requests. Please wait a moment and try again.',
              canRetry: true,
            };
          case 'INTERNAL_SERVER_ERROR':
            return {
              type: 'server' as const,
              message: "Server error. We're working to fix this.",
              canRetry: true,
            };
          default:
            return {
              type: 'unknown' as const,
              message: error.message || 'An unexpected error occurred.',
              canRetry: true,
            };
        }
      }

      // Handle network errors
      if (error?.message?.includes('fetch')) {
        return {
          type: 'network' as const,
          message: 'Network error. Please check your connection.',
          canRetry: true,
        };
      }

      // Default error
      return {
        type: 'unknown' as const,
        message: error?.message || 'An unexpected error occurred.',
        canRetry: true,
      };
    },
    [isOnline]
  );

  return { handleError, isOnline };
}
