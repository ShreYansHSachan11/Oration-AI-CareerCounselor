// Error Boundary Components
export {
  ErrorBoundary,
  ChatErrorBoundary,
  AuthErrorBoundary,
  useErrorBoundary,
} from './error-boundary';

// Error Message Components
export {
  ErrorMessage,
  NetworkError,
  AIServiceError,
  AuthError,
  RateLimitError,
  ErrorContainer,
  useErrorHandler,
  type ErrorType,
  type ErrorMessageProps,
} from './error-message';

// Network Status Components
export {
  NetworkStatus,
  NetworkAware,
  NetworkIndicator,
  useNetworkStatus,
  useNetworkAwareQuery,
  useTRPCErrorHandler,
} from './network-status';

// Fallback UI Components
export {
  ChatLoadingFallback,
  SessionListLoadingFallback,
  EmptyChatFallback,
  EmptySessionsFallback,
  EmptySearchFallback,
  NetworkErrorFallback,
  ServerErrorFallback,
  AuthErrorFallback,
  TimeoutErrorFallback,
  GenericErrorFallback,
  MaintenanceFallback,
  SmartFallback,
} from './fallback-ui';
