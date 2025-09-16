import { Message, MessageRole } from '@prisma/client';

/**
 * Core message types
 */
export interface ChatMessage extends Message {
  id: string;
  content: string;
  role: MessageRole;
  sessionId: string;
  createdAt: Date;
}

export interface MessageWithStatus extends ChatMessage {
  status?: 'sending' | 'sent' | 'delivered' | 'error';
  isOptimistic?: boolean;
}

/**
 * AI service types
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIServiceOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Message API response types
 */
export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  sessionTitle?: string | null;
}

export interface PaginatedMessages {
  items: ChatMessage[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Message validation types
 */
export interface MessageValidation {
  isValid: boolean;
  reason?: string;
}

/**
 * Message display types for UI components
 */
export interface MessageBubbleProps {
  message: MessageWithStatus;
  isLastMessage?: boolean;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export interface MessageListProps {
  messages: MessageWithStatus[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Chat input types
 */
export interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Message status types
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error';

export interface MessageStatusIndicatorProps {
  status: MessageStatus;
  timestamp?: Date;
}

/**
 * Typing indicator types
 */
export interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

/**
 * Error types for message operations
 */
export interface MessageError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Message search types
 */
export interface MessageSearchResult {
  message: ChatMessage;
  matchedText: string;
  context: string;
}

export interface MessageSearchResponse {
  results: MessageSearchResult[];
  totalCount: number;
  query: string;
}

/**
 * Message thread types for conversation context
 */
export interface MessageThread {
  sessionId: string;
  messages: ChatMessage[];
  totalCount: number;
  lastMessageAt: Date;
}

/**
 * Optimistic update types
 */
export interface OptimisticMessage
  extends Omit<ChatMessage, 'id' | 'createdAt'> {
  id: string; // Temporary ID for optimistic updates
  createdAt: Date;
  isOptimistic: true;
  status: 'sending';
}

/**
 * Message export types
 */
export interface ExportedMessage {
  content: string;
  role: string;
  timestamp: string;
}

export interface ExportedConversation {
  sessionId: string;
  title: string | null;
  messages: ExportedMessage[];
  exportedAt: string;
}
