// Main database exports
export { db } from './db';

// Service exports
export { UserService, ChatSessionService, MessageService } from './services';

// Utility exports
export { DatabaseUtils, DatabaseError, handleDatabaseError } from './db-utils';

// Type exports
export type {
  UserWithStats,
  ChatSessionWithMessageCount,
  ChatSessionWithMessages,
  MessageWithSession,
  CreateUserRequest,
  UpdateUserPreferencesRequest,
  CreateChatSessionRequest,
  UpdateChatSessionRequest,
  SendMessageRequest,
  PaginationParams,
  PaginatedResponse,
  MessagePair,
  UserActivitySummary,
  DatabaseStats,
  SearchParams,
  MessageSearchResult,
  DatabaseErrorInfo,
  CreateMessageData,
  UpdateChatSessionData,
  CreateChatSessionData,
  MessageValidation,
  SessionValidation,
  UserPreferencesValidation,
  DatabaseConfig,
  HealthCheckResult,
} from './types/database';

// Re-export Prisma types
export type {
  User,
  ChatSession,
  Message,
  MessageRole,
  Theme,
} from '@prisma/client';
