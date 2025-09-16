// Export all services
export { UserService } from './user.service';
export { ChatSessionService } from './chat-session.service';
export { MessageService } from './message.service';

// Export database utilities
export { DatabaseUtils, DatabaseError, handleDatabaseError } from '../db-utils';

// Export types
export type { CreateUserData, UpdateUserPreferences } from './user.service';

export type {
  CreateChatSessionData,
  UpdateChatSessionData,
  PaginationOptions,
  PaginatedResult,
  ChatSessionWithMessageCount,
  ChatSessionWithMessages,
} from './chat-session.service';

export type { CreateMessageData } from './message.service';

// Re-export Prisma types that are commonly used
export type {
  User,
  ChatSession,
  Message,
  MessageRole,
  Theme,
} from '@prisma/client';
