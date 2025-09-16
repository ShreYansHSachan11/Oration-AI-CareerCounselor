import { PrismaClient, Message, MessageRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export interface CreateMessageData {
  content: string;
  role: MessageRole;
  sessionId: string;
}

export interface MessageWithSession extends Message {
  session: {
    userId: string;
  };
}

export interface PaginatedMessages {
  items: Message[];
  nextCursor?: string;
  hasMore: boolean;
}

export class MessageService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new message
   */
  async createMessage(data: CreateMessageData): Promise<Message> {
    try {
      return await this.prisma.message.create({
        data,
      });
    } catch (error) {
      console.error('Error creating message:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create message',
      });
    }
  }

  /**
   * Get messages for a session with pagination
   */
  async getSessionMessages(
    sessionId: string,
    userId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginatedMessages> {
    try {
      // First verify the session belongs to the user
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      const messages = await this.prisma.message.findMany({
        where: { sessionId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'asc' },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: messages,
        nextCursor,
        hasMore: !!nextCursor,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error getting session messages:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve messages',
      });
    }
  }

  /**
   * Get conversation history for AI context
   */
  async getConversationHistory(
    sessionId: string,
    userId: string,
    limit: number = 20
  ): Promise<Message[]> {
    try {
      // Verify session ownership
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      return await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error getting conversation history:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve conversation history',
      });
    }
  }

  /**
   * Update a message (for regeneration)
   */
  async updateMessage(
    messageId: string,
    sessionId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    try {
      // Verify the message exists and belongs to the user's session
      const message = await this.prisma.message.findFirst({
        where: {
          id: messageId,
          sessionId,
          session: { userId },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      return await this.prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          createdAt: new Date(), // Update timestamp to show regeneration
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error updating message:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update message',
      });
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string,
    sessionId: string,
    userId: string
  ): Promise<void> {
    try {
      // Verify the message exists and belongs to the user's session
      const message = await this.prisma.message.findFirst({
        where: {
          id: messageId,
          sessionId,
          session: { userId },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      await this.prisma.message.delete({
        where: { id: messageId },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error deleting message:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete message',
      });
    }
  }

  /**
   * Get message count for a session
   */
  async getMessageCount(sessionId: string, userId: string): Promise<number> {
    try {
      // Verify session ownership
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      return await this.prisma.message.count({
        where: { sessionId },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error getting message count:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get message count',
      });
    }
  }

  /**
   * Search messages within a session
   */
  async searchMessages(
    sessionId: string,
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<Message[]> {
    try {
      // Verify session ownership
      const session = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      return await this.prisma.message.findMany({
        where: {
          sessionId,
          content: {
            contains: query,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error searching messages:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search messages',
      });
    }
  }
}
