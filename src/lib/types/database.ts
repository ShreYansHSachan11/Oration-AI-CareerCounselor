import type {
  User,
  ChatSession,
  Message,
  MessageRole,
  Theme,
} from '@prisma/client';

// Extended types for API responses
export interface UserWithStats extends User {
  _count: {
    chatSessions: number;
  };
}

export interface ChatSessionWithMessageCount extends ChatSession {
  _count: {
    messages: number;
  };
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: Message[];
}

export interface MessageWithSession extends Message {
  session: {
    title: string | null;
    userId: string;
  };
}

// API request/response types
export interface CreateUserRequest {
  email: string;
  name?: string;
  image?: string;
}

export interface UpdateUserPreferencesRequest {
  theme?: Theme;
  emailNotifications?: boolean;
}

export interface CreateChatSessionRequest {
  title?: string;
}

export interface UpdateChatSessionRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  sessionId: string;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// Database operation result types
export interface MessagePair {
  userMessage: Message;
  aiMessage: Message;
}

export interface UserActivitySummary {
  userId: string;
  sessionCount: number;
  messageCount: number;
  lastActivity: Date;
  memberSince: Date;
}

export interface DatabaseStats {
  users: number;
  sessions: number;
  messages: number;
}

// Search and filter types
export interface SearchParams {
  query: string;
  limit?: number;
  cursor?: string;
}

export interface MessageSearchResult extends Message {
  session: {
    title: string | null;
  };
}

// Error types
export interface DatabaseErrorInfo {
  code: string;
  message: string;
  field?: string;
}

// Utility types for service methods
export type CreateMessageData = {
  content: string;
  role: MessageRole;
  sessionId: string;
};

export type UpdateChatSessionData = {
  title?: string;
};

export type CreateChatSessionData = {
  userId: string;
  title?: string;
};

// Validation schemas (for use with zod or similar)
export interface MessageValidation {
  content: string; // min: 1, max: 4000
  sessionId: string; // cuid format
}

export interface SessionValidation {
  title?: string; // min: 1, max: 100
}

export interface UserPreferencesValidation {
  theme?: 'LIGHT' | 'DARK';
  emailNotifications?: boolean;
}

// Database connection types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  latency?: number;
  error?: string;
}
