'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  Server,
  Shield,
  Search,
  Plus,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FallbackUIProps {
  className?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  isRetrying?: boolean;
}

// Loading fallbacks
export function ChatLoadingFallback({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header skeleton */}
      <div className="border-b p-4">
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              i % 2 === 0 ? 'justify-start' : 'justify-end'
            )}
          >
            <div
              className={cn(
                'max-w-xs space-y-2',
                i % 2 === 0 ? 'mr-auto' : 'ml-auto'
              )}
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className={cn('h-16', i % 2 === 0 ? 'w-48' : 'w-40')} />
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function SessionListLoadingFallback({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn('space-y-2 p-4', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state fallbacks
export function EmptyChatFallback({
  className,
  onAction,
  actionLabel = 'Start New Chat',
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center h-full p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Welcome to Career Chat
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start a conversation with our AI career counselor to get personalized
        guidance and advice for your career journey.
      </p>
      {onAction && (
        <Button onClick={onAction} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

export function EmptySessionsFallback({
  className,
  onAction,
  actionLabel = 'Start Your First Chat',
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No conversations yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You haven&apos;t started any conversations. Create your first chat to
        begin getting career guidance.
      </p>
      {onAction && (
        <Button onClick={onAction} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

export function EmptySearchFallback({
  className,
  searchQuery,
}: {
  className?: string;
  searchQuery?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No results found
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {searchQuery
          ? `No conversations found matching "${searchQuery}". Try a different search term.`
          : 'No conversations match your search criteria.'}
      </p>
    </motion.div>
  );
}

// Error state fallbacks
export function NetworkErrorFallback({
  className,
  onRetry,
  isRetrying = false,
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Connection Problem
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Unable to connect to the server. Please check your internet connection
        and try again.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Connecting...' : 'Try Again'}
        </Button>
      )}
    </motion.div>
  );
}

export function ServerErrorFallback({
  className,
  onRetry,
  isRetrying = false,
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
        <Server className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Server Error
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Something went wrong on our end. We&apos;re working to fix it. Please
        try again in a moment.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </motion.div>
  );
}

export function AuthErrorFallback({
  className,
  onAction,
  actionLabel = 'Sign In',
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950 rounded-full flex items-center justify-center mb-4">
        <Shield className="w-8 h-8 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Authentication Required
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You need to sign in to access your chat conversations and continue
        getting career guidance.
      </p>
      {onAction && (
        <Button onClick={onAction} className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

export function TimeoutErrorFallback({
  className,
  onRetry,
  isRetrying = false,
}: FallbackUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-950 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-yellow-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Request Timeout
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        The request took too long to complete. This might be due to a slow
        connection or server load.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </motion.div>
  );
}

export function GenericErrorFallback({
  className,
  onRetry,
  onAction,
  actionLabel = 'Go Home',
  isRetrying = false,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again or go back to the home page.',
}: FallbackUIProps & {
  title?: string;
  message?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={cn('w-4 h-4', isRetrying && 'animate-spin')}
            />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </Button>
        )}
        {onAction && (
          <Button onClick={onAction} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Maintenance mode fallback
export function MaintenanceFallback({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center min-h-screen p-8 text-center',
        className
      )}
    >
      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mb-6">
        <Server className="w-10 h-10 text-blue-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Scheduled Maintenance
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We&apos;re currently performing scheduled maintenance to improve your
        experience. We&apos;ll be back shortly. Thank you for your patience.
      </p>
      <div className="text-sm text-muted-foreground">
        Expected completion: <span className="font-medium">30 minutes</span>
      </div>
    </motion.div>
  );
}

// Composite fallback component that chooses the right fallback based on error type
export function SmartFallback({
  error,
  isLoading,
  isEmpty,
  onRetry,
  onAction,
  className,
  ...props
}: {
  error?: Error | null;
  isLoading?: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  onAction?: () => void;
  className?: string;
  [key: string]: any;
}) {
  if (isLoading) {
    return <ChatLoadingFallback className={className} />;
  }

  if (error) {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return (
        <NetworkErrorFallback
          className={className}
          onRetry={onRetry}
          {...props}
        />
      );
    }

    if (errorMessage.includes('timeout')) {
      return (
        <TimeoutErrorFallback
          className={className}
          onRetry={onRetry}
          {...props}
        />
      );
    }

    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('auth')
    ) {
      return (
        <AuthErrorFallback
          className={className}
          onAction={onAction}
          {...props}
        />
      );
    }

    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return (
        <ServerErrorFallback
          className={className}
          onRetry={onRetry}
          {...props}
        />
      );
    }

    return (
      <GenericErrorFallback
        className={className}
        onRetry={onRetry}
        onAction={onAction}
        {...props}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyChatFallback className={className} onAction={onAction} {...props} />
    );
  }

  return null;
}
