import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { ErrorMessage } from '@/components/error/error-message';
import {
  NetworkStatus,
  useNetworkStatus,
} from '@/components/error/network-status';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { ErrorProvider } from '@/components/providers/error-provider';
import { TRPCClientError } from '@trpc/client';

// Mock navigator for testing
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
});

// Mock components for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

function NetworkStatusTest() {
  const { isOnline } = useNetworkStatus();
  return (
    <div data-testid="network-status">{isOnline ? 'online' : 'offline'}</div>
  );
}

function ErrorHandlingTest() {
  const { errors, addError, removeError } = useErrorHandling();

  return (
    <div>
      <button
        onClick={() => addError('network')}
        data-testid="add-network-error"
      >
        Add Network Error
      </button>
      <button
        onClick={() => addError(new Error('Test error'))}
        data-testid="add-generic-error"
      >
        Add Generic Error
      </button>
      <div data-testid="error-count">{errors.length}</div>
      {errors.map(error => (
        <div key={error.id} data-testid={`error-${error.id}`}>
          {error.message}
          <button onClick={() => removeError(error.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}

describe('Error Handling System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ErrorBoundary', () => {
    it('should catch and display errors', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reset error state when retry is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('ErrorMessage', () => {
    it('should display network error correctly', () => {
      const onRetry = vi.fn();

      render(<ErrorMessage type="network" onRetry={onRetry} />);

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to connect to the server/)
      ).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });

    it('should display custom error message', () => {
      render(
        <ErrorMessage
          type="server"
          title="Custom Title"
          message="Custom message"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('should show retry count', () => {
      render(
        <ErrorMessage
          type="network"
          onRetry={() => {}}
          retryCount={2}
          maxRetries={3}
        />
      );

      expect(screen.getByText('Retry 2/3')).toBeInTheDocument();
    });

    it('should disable retry when max retries reached', () => {
      render(
        <ErrorMessage
          type="network"
          onRetry={() => {}}
          retryCount={3}
          maxRetries={3}
        />
      );

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('NetworkStatus', () => {
    it('should detect online status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      render(<NetworkStatusTest />);
      expect(screen.getByTestId('network-status')).toHaveTextContent('online');
    });

    it('should detect offline status', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<NetworkStatusTest />);
      expect(screen.getByTestId('network-status')).toHaveTextContent('offline');
    });

    it('should show offline banner when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<NetworkStatus />);
      expect(screen.getByText('No internet connection')).toBeInTheDocument();
    });
  });

  describe('useErrorHandling hook', () => {
    it('should add and remove errors', async () => {
      render(
        <ErrorProvider>
          <ErrorHandlingTest />
        </ErrorProvider>
      );

      expect(screen.getByTestId('error-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('add-network-error'));
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });

      fireEvent.click(screen.getByTestId('add-generic-error'));
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('2');
      });
    });

    it('should parse tRPC errors correctly', () => {
      function TestComponent() {
        const { addError } = useErrorHandling();

        React.useEffect(() => {
          const tRPCError = new TRPCClientError('Unauthorized', {
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          });

          const errorId = addError(tRPCError);
          expect(errorId).toBeDefined();
        }, [addError]);

        return <div>Test</div>;
      }

      render(<TestComponent />);
    });
  });

  describe('Error Provider Integration', () => {
    it('should provide error context to children', () => {
      render(
        <ErrorProvider showToasts={false}>
          <ErrorHandlingTest />
        </ErrorProvider>
      );

      expect(screen.getByTestId('error-count')).toBeInTheDocument();
      expect(screen.getByTestId('add-network-error')).toBeInTheDocument();
    });

    it('should handle toast errors when enabled', async () => {
      render(
        <ErrorProvider showToasts={true} toastDuration={1000}>
          <ErrorHandlingTest />
        </ErrorProvider>
      );

      fireEvent.click(screen.getByTestId('add-network-error'));

      // Toast should appear
      await waitFor(() => {
        expect(screen.getByText(/Connection Problem/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle retry with exponential backoff', async () => {
      const retryFn = vi.fn().mockResolvedValue(undefined);

      function TestComponent() {
        const { retryError } = useErrorHandling({ retryDelay: 100 });

        React.useEffect(() => {
          const errorId = 'test-error';
          retryError(errorId, retryFn);
        }, [retryError]);

        return <div>Test</div>;
      }

      render(<TestComponent />);

      await waitFor(
        () => {
          expect(retryFn).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it('should stop retrying after max attempts', () => {
      const onMaxRetriesReached = vi.fn();

      function TestComponent() {
        const { retryError } = useErrorHandling({
          maxRetries: 2,
          onMaxRetriesReached,
        });

        React.useEffect(() => {
          // Simulate multiple retries
          const errorId = 'test-error';
          retryError(errorId);
          retryError(errorId);
          retryError(errorId); // This should trigger max retries
        }, [retryError]);

        return <div>Test</div>;
      }

      render(<TestComponent />);
      expect(onMaxRetriesReached).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ErrorMessage type="network" onRetry={() => {}} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const onRetry = vi.fn();
      render(<ErrorMessage type="network" onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      retryButton.focus();
      fireEvent.keyDown(retryButton, { key: 'Enter' });

      expect(onRetry).toHaveBeenCalled();
    });
  });
});
