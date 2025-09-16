'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ErrorMessage,
  NetworkError,
  AIServiceError,
  AuthError,
  RateLimitError,
} from '@/components/error/error-message';
import {
  NetworkStatus,
  NetworkIndicator,
  NetworkAware,
} from '@/components/error/network-status';
import {
  EmptyChatFallback,
  NetworkErrorFallback,
  ServerErrorFallback,
  SmartFallback,
} from '@/components/error/fallback-ui';
import { ErrorBoundary } from '@/components/error/error-boundary';
import {
  useErrorContext,
  ErrorDisplayContainer,
} from '@/components/providers/error-provider';
import { TRPCClientError } from '@trpc/client';

function ThrowErrorComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error from a component');
  }
  return (
    <div className="p-4 bg-green-100 rounded">Component is working fine!</div>
  );
}

function ErrorDemoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

export default function ErrorHandlingDemo() {
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const { addError, errors, clearErrors } = useErrorContext();

  const handleAddError = (type: string) => {
    switch (type) {
      case 'network':
        addError(new Error('Network connection failed'));
        break;
      case 'server':
        addError(new TRPCClientError('Internal Server Error'));
        break;
      case 'auth':
        addError(new TRPCClientError('Unauthorized'));
        break;
      case 'rate-limit':
        addError(new TRPCClientError('Too Many Requests'));
        break;
      case 'ai-service':
        addError(new Error('AI service is temporarily unavailable'));
        break;
      default:
        addError(new Error('Unknown error occurred'));
    }
  };

  const simulateAsyncError = async () => {
    setIsLoading(true);
    try {
      // Simulate async operation that fails
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Async operation failed')), 1000)
      );
    } catch (error) {
      addError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Error Handling System Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive error handling and user feedback system
        </p>
      </div>

      {/* Network Status */}
      <ErrorDemoSection title="Network Status">
        <div className="space-y-4">
          <NetworkIndicator />
          <NetworkStatus />
          <Button
            onClick={() => setSimulateOffline(!simulateOffline)}
            variant="outline"
          >
            {simulateOffline ? 'Simulate Online' : 'Simulate Offline'}
          </Button>

          <NetworkAware
            fallback={
              <div className="p-4 bg-red-100 rounded">You are offline!</div>
            }
          >
            <div className="p-4 bg-green-100 rounded">You are online!</div>
          </NetworkAware>
        </div>
      </ErrorDemoSection>

      {/* Error Messages */}
      <ErrorDemoSection title="Error Message Types">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Button
              onClick={() => handleAddError('network')}
              variant="outline"
              className="w-full"
            >
              Network Error
            </Button>
            <Button
              onClick={() => handleAddError('server')}
              variant="outline"
              className="w-full"
            >
              Server Error
            </Button>
            <Button
              onClick={() => handleAddError('auth')}
              variant="outline"
              className="w-full"
            >
              Auth Error
            </Button>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => handleAddError('rate-limit')}
              variant="outline"
              className="w-full"
            >
              Rate Limit Error
            </Button>
            <Button
              onClick={() => handleAddError('ai-service')}
              variant="outline"
              className="w-full"
            >
              AI Service Error
            </Button>
            <Button
              onClick={simulateAsyncError}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Async Error'}
            </Button>
          </div>
        </div>

        <Button onClick={clearErrors} variant="destructive" className="w-full">
          Clear All Errors ({errors.length})
        </Button>
      </ErrorDemoSection>

      {/* Error Display Container */}
      {errors.length > 0 && (
        <ErrorDemoSection title="Active Errors">
          <ErrorDisplayContainer maxErrors={5} />
        </ErrorDemoSection>
      )}

      {/* Specialized Error Components */}
      <ErrorDemoSection title="Specialized Error Components">
        <div className="space-y-4">
          <NetworkError onRetry={() => console.log('Network retry')} />
          <AIServiceError onRetry={() => console.log('AI service retry')} />
          <AuthError />
          <RateLimitError onRetry={() => console.log('Rate limit retry')} />
        </div>
      </ErrorDemoSection>

      {/* Error Boundary Demo */}
      <ErrorDemoSection title="Error Boundary">
        <div className="space-y-4">
          <Button
            onClick={() => setShowError(!showError)}
            variant={showError ? 'destructive' : 'default'}
          >
            {showError ? 'Fix Component' : 'Break Component'}
          </Button>

          <ErrorBoundary>
            <ThrowErrorComponent shouldThrow={showError} />
          </ErrorBoundary>
        </div>
      </ErrorDemoSection>

      {/* Fallback UI Components */}
      <ErrorDemoSection title="Fallback UI States">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setIsLoading(!isLoading)} variant="outline">
              Toggle Loading
            </Button>
            <Button onClick={() => setIsEmpty(!isEmpty)} variant="outline">
              Toggle Empty
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <SmartFallback
                isLoading={isLoading}
                isEmpty={isEmpty}
                onRetry={() => console.log('Retry')}
                onAction={() => console.log('Action')}
              />
            </div>

            <div className="space-y-4">
              <div className="h-32">
                <EmptyChatFallback onAction={() => console.log('New chat')} />
              </div>
              <div className="h-32">
                <NetworkErrorFallback
                  onRetry={() => console.log('Network retry')}
                />
              </div>
            </div>
          </div>
        </div>
      </ErrorDemoSection>

      {/* Custom Error Messages */}
      <ErrorDemoSection title="Custom Error Messages">
        <div className="space-y-4">
          <ErrorMessage
            type="validation"
            title="Custom Validation Error"
            message="This is a custom validation error message with details."
            details="Field 'email' is required and must be a valid email address."
            showDetails={true}
          />

          <ErrorMessage
            type="timeout"
            title="Request Timeout"
            message="The request took too long to complete."
            onRetry={() => console.log('Timeout retry')}
            retryCount={2}
            maxRetries={3}
            autoRetry={false}
          />
        </div>
      </ErrorDemoSection>
    </div>
  );
}
