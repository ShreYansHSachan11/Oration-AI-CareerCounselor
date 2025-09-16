import { db } from '../db';
import type { ChatSession, Message } from '@prisma/client';

export interface CreateChatSessionData {
  userId: string;
  title?: string;
}

export interface UpdateChatSessionData {
  title?: string;
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

export type ChatSessionWithMessageCount = ChatSession & {
  _count: {
    messages: number;
  };
};

export type ChatSessionWithMessages = ChatSession & {
  messages: Message[];
};

export class ChatSessionService {
  /**
   * Create a new chat session
   */
  static async createChatSession(
    data: CreateChatSessionData
  ): Promise<ChatSession> {
    return db.chatSession.create({
      data,
    });
  }

  /**
   * Get chat session by ID
   */
  static async getChatSessionById(
    sessionId: string,
    userId: string
  ): Promise<ChatSession | null> {
    return db.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  }

  /**
   * Get chat session with messages
   */
  static async getChatSessionWithMessages(
    sessionId: string,
    userId: string
  ): Promise<ChatSessionWithMessages | null> {
    return db.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get user's chat sessions with pagination
   */
  static async getUserChatSessions(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ChatSessionWithMessageCount>> {
    const { limit = 20, cursor } = options;

    const sessions = await db.chatSession.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
    });

    const hasMore = sessions.length > limit;
    const items = hasMore ? sessions.slice(0, -1) : sessions;
    const nextCursor = hasMore ? sessions[sessions.length - 2]?.id : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Update chat session
   */
  static async updateChatSession(
    sessionId: string,
    userId: string,
    data: UpdateChatSessionData
  ): Promise<ChatSession> {
    return db.chatSession.update({
      where: {
        id: sessionId,
        userId,
      },
      data,
    });
  }

  /**
   * Delete chat session
   */
  static async deleteChatSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    await db.chatSession.delete({
      where: {
        id: sessionId,
        userId,
      },
    });
  }

  /**
   * Search chat sessions by title
   */
  static async searchChatSessions(
    userId: string,
    query: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ChatSessionWithMessageCount>> {
    const { limit = 20, cursor } = options;

    const sessions = await db.chatSession.findMany({
      where: {
        userId,
        title: {
          contains: query,
        },
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    });

    const hasMore = sessions.length > limit;
    const items = hasMore ? sessions.slice(0, -1) : sessions;
    const nextCursor = hasMore ? sessions[sessions.length - 2]?.id : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Update session's updatedAt timestamp (called when new message is added)
   */
  static async touchChatSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    await db.chatSession.update({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        updatedAt: new Date(),
      },
    });
  }
}
