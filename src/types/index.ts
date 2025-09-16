// Core application types
export interface ChatSession {
  id: string;
  title: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  sessionId: string;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ChatSessionWithMessageCount extends ChatSession {
  _count: {
    messages: number;
  };
}

// Error types
export interface ErrorResponse {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
