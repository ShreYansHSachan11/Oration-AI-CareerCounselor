import { db } from '../db';
import type { Message, MessageRole } from '@prisma/client';
import { ChatSessionService } from './chat-session.service';

export interface CreateMessageData {
  content: string;
  role: MessageRole;
  sessionId: string;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export class MessageService {
  /**
   * Create a new message
   */
  static async createMessage(
    data: CreateMessageData,
    userId: string
  ): Promise<Message> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      data.sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    const message = await db.message.create({
      data,
    });

    // Update the session's updatedAt timestamp
    await ChatSessionService.touchChatSession(data.sessionId, userId);

    return message;
  }

  /**
   * Get message by ID
   */
  static async getMessageById(
    messageId: string,
    userId: string
  ): Promise<Message | null> {
    return db.message.findFirst({
      where: {
        id: messageId,
        session: {
          userId,
        },
      },
    });
  }

  /**
   * Get messages for a chat session with pagination
   */
  static async getSessionMessages(
    sessionId: string,
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Message>> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    const { limit = 50, cursor } = options;

    const messages = await db.message.findMany({
      where: { sessionId },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? messages[messages.length - 2]?.id : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get recent messages for a chat session (for context)
   */
  static async getRecentMessages(
    sessionId: string,
    userId: string,
    limit: number = 10
  ): Promise<Message[]> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    return db.message.findMany({
      where: { sessionId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Verify the message belongs to the user
    const message = await this.getMessageById(messageId, userId);
    if (!message) {
      throw new Error('Message not found or access denied');
    }

    await db.message.delete({
      where: { id: messageId },
    });
  }

  /**
   * Delete all messages in a session
   */
  static async deleteSessionMessages(
    sessionId: string,
    userId: string
  ): Promise<void> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    await db.message.deleteMany({
      where: { sessionId },
    });
  }

  /**
   * Create multiple messages in a transaction (user message + AI response)
   */
  static async createMessagePair(
    userMessage: string,
    aiResponse: string,
    sessionId: string,
    userId: string
  ): Promise<{ userMessage: Message; aiMessage: Message }> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    const result = await db.$transaction(async tx => {
      const userMsg = await tx.message.create({
        data: {
          content: userMessage,
          role: 'USER',
          sessionId,
        },
      });

      const aiMsg = await tx.message.create({
        data: {
          content: aiResponse,
          role: 'ASSISTANT',
          sessionId,
        },
      });

      // Update session timestamp
      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      return { userMessage: userMsg, aiMessage: aiMsg };
    });

    return result;
  }

  /**
   * Get message count for a session
   */
  static async getMessageCount(
    sessionId: string,
    userId: string
  ): Promise<number> {
    // Verify the session belongs to the user
    const session = await ChatSessionService.getChatSessionById(
      sessionId,
      userId
    );
    if (!session) {
      throw new Error('Chat session not found or access denied');
    }

    return db.message.count({
      where: { sessionId },
    });
  }

  /**
   * Search messages by content
   */
  static async searchMessages(
    userId: string,
    query: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Message & { session: { title: string | null } }>> {
    const { limit = 20, cursor } = options;

    const messages = await db.message.findMany({
      where: {
        content: {
          contains: query,
        },
        session: {
          userId,
        },
      },
      include: {
        session: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? messages[messages.length - 2]?.id : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}
