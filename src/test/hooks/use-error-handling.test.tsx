import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { ErrorProvider } from '@/components/providers/error-provider';
import { TRPCClientError } from '@trpc/client';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorProvider showToasts={false}>{children}</ErrorProvider>
);

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  it('should initialize with empty errors array', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    expect(result.current.errors).toEqual([]);
  });

  it('should add string error', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('Network connection failed');
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      message: 'Network connection failed',
      type: 'generic',
      id: expect.any(String),
      timestamp: expect.any(Date),
    });
  });

  it('should add Error object', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    const error = new Error('Something went wrong');

    act(() => {
      result.current.addError(error);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      message: 'Something went wrong',
      type: 'generic',
      id: expect.any(String),
      timestamp: expect.any(Date),
    });
  });

  it('should add tRPC error with proper parsing', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    const tRPCError = new TRPCClientError('Unauthorized access', {
      data: { code: 'UNAUTHORIZED', httpStatus: 401 },
    });

    act(() => {
      result.current.addError(tRPCError);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      message: 'Unauthorized access',
      type: 'api',
      code: 'UNAUTHORIZED',
      id: expect.any(String),
      timestamp: expect.any(Date),
    });
  });

  it('should add predefined error types', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('network');
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]).toMatchObject({
      message: expect.stringContaining('network'),
      type: 'network',
      id: expect.any(String),
      timestamp: expect.any(Date),
    });
  });

  it('should remove error by id', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    let errorId: string;

    act(() => {
      errorId = result.current.addError('Test error');
    });

    expect(result.current.errors).toHaveLength(1);

    act(() => {
      result.current.removeError(errorId);
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('Error 1');
      result.current.addError('Error 2');
      result.current.addError('Error 3');
    });

    expect(result.current.errors).toHaveLength(3);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('should handle retry functionality', async () => {
    const retryFn = vi.fn().mockResolvedValue('success');

    const { result } = renderHook(
      () =>
        useErrorHandling({
          retryDelay: 10, // Short delay for testing
        }),
      {
        wrapper: TestWrapper,
      }
    );

    let errorId: string;

    act(() => {
      errorId = result.current.addError('Retryable error');
    });

    await act(async () => {
      await result.current.retryError(errorId, retryFn);
    });

    expect(retryFn).toHaveBeenCalled();
  });

  it('should handle retry with exponential backoff', async () => {
    const retryFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Retry 1'))
      .mockRejectedValueOnce(new Error('Retry 2'))
      .mockResolvedValue('success');

    const { result } = renderHook(
      () =>
        useErrorHandling({
          retryDelay: 10,
          maxRetries: 3,
        }),
      {
        wrapper: TestWrapper,
      }
    );

    let errorId: string;

    act(() => {
      errorId = result.current.addError('Retryable error');
    });

    await act(async () => {
      await result.current.retryError(errorId, retryFn);
    });

    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it('should stop retrying after max attempts', async () => {
    const retryFn = vi.fn().mockRejectedValue(new Error('Always fails'));
    const onMaxRetriesReached = vi.fn();

    const { result } = renderHook(
      () =>
        useErrorHandling({
          retryDelay: 10,
          maxRetries: 2,
          onMaxRetriesReached,
        }),
      {
        wrapper: TestWrapper,
      }
    );

    let errorId: string;

    act(() => {
      errorId = result.current.addError('Retryable error');
    });

    await act(async () => {
      await result.current.retryError(errorId, retryFn);
    });

    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(onMaxRetriesReached).toHaveBeenCalledWith(errorId);
  });

  it('should handle network error type', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('network');
    });

    expect(result.current.errors[0]).toMatchObject({
      type: 'network',
      message: expect.stringContaining('connection'),
    });
  });

  it('should handle server error type', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('server');
    });

    expect(result.current.errors[0]).toMatchObject({
      type: 'server',
      message: expect.stringContaining('server'),
    });
  });

  it('should handle validation error type', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('validation');
    });

    expect(result.current.errors[0]).toMatchObject({
      type: 'validation',
      message: expect.stringContaining('validation'),
    });
  });

  it('should prevent duplicate errors', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('Duplicate error');
      result.current.addError('Duplicate error');
    });

    expect(result.current.errors).toHaveLength(1);
  });

  it('should auto-remove errors after timeout', async () => {
    const { result } = renderHook(
      () =>
        useErrorHandling({
          autoRemoveDelay: 50, // Short delay for testing
        }),
      {
        wrapper: TestWrapper,
      }
    );

    act(() => {
      result.current.addError('Auto-remove error');
    });

    expect(result.current.errors).toHaveLength(1);

    // Wait for auto-removal
    await new Promise(resolve => setTimeout(resolve, 60));

    expect(result.current.errors).toHaveLength(0);
  });

  it('should handle error context properly', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.addError('Test error', { context: 'Chat sending' });
    });

    expect(result.current.errors[0]).toMatchObject({
      message: 'Test error',
      context: 'Chat sending',
    });
  });

  it('should return error ID when adding error', () => {
    const { result } = renderHook(() => useErrorHandling(), {
      wrapper: TestWrapper,
    });

    let errorId: string;

    act(() => {
      errorId = result.current.addError('Test error');
    });

    expect(errorId).toBeDefined();
    expect(typeof errorId).toBe('string');
    expect(result.current.errors[0].id).toBe(errorId);
  });

  it('should handle errors without context provider gracefully', () => {
    const { result } = renderHook(() => useErrorHandling());

    // Should not throw when used outside provider
    expect(() => {
      act(() => {
        result.current.addError('Test error');
      });
    }).not.toThrow();
  });
});
