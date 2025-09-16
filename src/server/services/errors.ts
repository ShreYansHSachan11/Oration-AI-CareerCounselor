import { TRPCError } from '@trpc/server';

/**
 * Custom error classes for the application
 */

export class ChatError extends Error {
  constructor(
    message: string,
    public code:
      | 'RATE_LIMIT'
      | 'AI_UNAVAILABLE'
      | 'SESSION_NOT_FOUND'
      | 'UNAUTHORIZED'
      | 'INVALID_MESSAGE'
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'API_KEY_MISSING'
      | 'RATE_LIMIT'
      | 'SERVICE_UNAVAILABLE'
      | 'INVALID_RESPONSE'
      | 'NETWORK_ERROR',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Convert custom errors to tRPC errors
 */
export function handleServiceError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof ChatError) {
    switch (error.code) {
      case 'RATE_LIMIT':
        return new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error.message,
        });
      case 'AI_UNAVAILABLE':
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      case 'SESSION_NOT_FOUND':
        return new TRPCError({
          code: 'NOT_FOUND',
          message: error.message,
        });
      case 'UNAUTHORIZED':
        return new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      case 'INVALID_MESSAGE':
        return new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
    }
  }

  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'API_KEY_MISSING':
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI service configuration error',
        });
      case 'RATE_LIMIT':
        return new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: error.message,
        });
      case 'SERVICE_UNAVAILABLE':
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      case 'NETWORK_ERROR':
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Network error connecting to AI service',
        });
      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
    }
  }

  // Generic error fallback
  console.error('Unhandled error:', error);
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}

/**
 * Error response interface for consistent error formatting
 */
export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Format error for client response
 */
export function formatErrorResponse(error: TRPCError): ErrorResponse {
  return {
    message: error.message,
    code: error.code,
    details: error.cause ? { cause: error.cause } : undefined,
    timestamp: new Date().toISOString(),
  };
}
