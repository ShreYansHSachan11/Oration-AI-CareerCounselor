import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from '@/lib/services/message.service';
import { ChatSessionService } from '@/lib/services/chat-session.service';
import { db } from '@/lib/db';
import type { Message, MessageRole } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    message: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/services/chat-session.service', () => ({
  ChatSessionService: {
    getChatSessionById: vi.fn(),
    touchChatSession: vi.fn(),
  },
}));

describe('MessageService', () => {
  const mockUserId = 'test-user-id';
  const mockSessionId = 'test-session-id';
  const mockMessageId = 'test-message-id';

  const mockSession = {
    id: mockSessionId,
    title: 'Test Session',
    userId: mockUserId,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockMessage: Message = {
    id: mockMessageId,
    content: 'Hello, I need career advice',
    role: 'USER' as MessageRole,
    sessionId: mockSessionId,
    createdAt: new Date('2024-01-01T10:01:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a new message successfully', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockTouchChatSession = vi.mocked(
        ChatSessionService.touchChatSession
      );
      const mockCreate = vi.mocked(db.message.create);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockCreate.mockResolvedValue(mockMessage);
      mockTouchChatSession.mockResolvedValue();

      const messageData = {
        content: 'Hello, I need career advice',
        role: 'USER' as MessageRole,
        sessionId: mockSessionId,
      };

      const result = await MessageService.createMessage(
        messageData,
        mockUserId
      );

      expect(mockGetChatSessionById).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
      expect(mockCreate).toHaveBeenCalledWith({ data: messageData });
      expect(mockTouchChatSession).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
      expect(result).toEqual(mockMessage);
    });

    it('should throw error when session not found', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      mockGetChatSessionById.mockResolvedValue(null);

      const messageData = {
        content: 'Hello, I need career advice',
        role: 'USER' as MessageRole,
        sessionId: mockSessionId,
      };

      await expect(
        MessageService.createMessage(messageData, mockUserId)
      ).rejects.toThrow('Chat session not found or access denied');
    });

    it('should handle database errors', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockCreate = vi.mocked(db.message.create);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockCreate.mockRejectedValue(new Error('Database error'));

      const messageData = {
        content: 'Hello, I need career advice',
        role: 'USER' as MessageRole,
        sessionId: mockSessionId,
      };

      await expect(
        MessageService.createMessage(messageData, mockUserId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getMessageById', () => {
    it('should return message when found', async () => {
      const mockFindFirst = vi.mocked(db.message.findFirst);
      mockFindFirst.mockResolvedValue(mockMessage);

      const result = await MessageService.getMessageById(
        mockMessageId,
        mockUserId
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: mockMessageId,
          session: {
            userId: mockUserId,
          },
        },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should return null when message not found', async () => {
      const mockFindFirst = vi.mocked(db.message.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await MessageService.getMessageById(
        'non-existent',
        mockUserId
      );

      expect(result).toBeNull();
    });
  });

  describe('getSessionMessages', () => {
    it('should return paginated messages for valid session', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockFindMany = vi.mocked(db.message.findMany);

      const messages = [mockMessage];
      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockFindMany.mockResolvedValue(messages);

      const result = await MessageService.getSessionMessages(
        mockSessionId,
        mockUserId
      );

      expect(mockGetChatSessionById).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
        orderBy: { createdAt: 'asc' },
        take: 51, // limit + 1
      });

      expect(result).toEqual({
        items: messages,
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle pagination with cursor', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockFindMany = vi.mocked(db.message.findMany);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockFindMany.mockResolvedValue([mockMessage]);

      const options = { limit: 20, cursor: 'cursor-id' };
      await MessageService.getSessionMessages(
        mockSessionId,
        mockUserId,
        options
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
        orderBy: { createdAt: 'asc' },
        take: 21,
        cursor: { id: 'cursor-id' },
        skip: 1,
      });
    });

    it('should indicate when there are more results', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockFindMany = vi.mocked(db.message.findMany);

      const messages = Array.from({ length: 21 }, (_, i) => ({
        ...mockMessage,
        id: `message-${i}`,
      }));

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockFindMany.mockResolvedValue(messages);

      const result = await MessageService.getSessionMessages(
        mockSessionId,
        mockUserId,
        { limit: 20 }
      );

      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe('message-18'); // Second to last item
    });

    it('should throw error when session not found', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      mockGetChatSessionById.mockResolvedValue(null);

      await expect(
        MessageService.getSessionMessages(mockSessionId, mockUserId)
      ).rejects.toThrow('Chat session not found or access denied');
    });
  });

  describe('getRecentMessages', () => {
    it('should return recent messages in descending order', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockFindMany = vi.mocked(db.message.findMany);

      const recentMessages = [mockMessage];
      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockFindMany.mockResolvedValue(recentMessages);

      const result = await MessageService.getRecentMessages(
        mockSessionId,
        mockUserId,
        5
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      expect(result).toEqual(recentMessages);
    });

    it('should use default limit when not specified', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockFindMany = vi.mocked(db.message.findMany);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockFindMany.mockResolvedValue([]);

      await MessageService.getRecentMessages(mockSessionId, mockUserId);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
        orderBy: { createdAt: 'desc' },
        take: 10, // default limit
      });
    });
  });

  describe('deleteMessage', () => {
    it('should delete message when user has access', async () => {
      const mockGetMessageById = vi.spyOn(MessageService, 'getMessageById');
      const mockDelete = vi.mocked(db.message.delete);

      mockGetMessageById.mockResolvedValue(mockMessage);
      mockDelete.mockResolvedValue(mockMessage);

      await MessageService.deleteMessage(mockMessageId, mockUserId);

      expect(mockGetMessageById).toHaveBeenCalledWith(
        mockMessageId,
        mockUserId
      );
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: mockMessageId },
      });
    });

    it('should throw error when message not found', async () => {
      const mockGetMessageById = vi.spyOn(MessageService, 'getMessageById');
      mockGetMessageById.mockResolvedValue(null);

      await expect(
        MessageService.deleteMessage(mockMessageId, mockUserId)
      ).rejects.toThrow('Message not found or access denied');
    });
  });

  describe('deleteSessionMessages', () => {
    it('should delete all messages in session', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockDeleteMany = vi.mocked(db.message.deleteMany);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockDeleteMany.mockResolvedValue({ count: 5 });

      await MessageService.deleteSessionMessages(mockSessionId, mockUserId);

      expect(mockGetChatSessionById).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId
      );
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
      });
    });

    it('should throw error when session not found', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      mockGetChatSessionById.mockResolvedValue(null);

      await expect(
        MessageService.deleteSessionMessages(mockSessionId, mockUserId)
      ).rejects.toThrow('Chat session not found or access denied');
    });
  });

  describe('createMessagePair', () => {
    it('should create user and AI messages in transaction', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockTransaction = vi.mocked(db.$transaction);

      const userMessage = {
        ...mockMessage,
        content: 'User message',
        role: 'USER' as MessageRole,
      };
      const aiMessage = {
        ...mockMessage,
        id: 'ai-message',
        content: 'AI response',
        role: 'ASSISTANT' as MessageRole,
      };

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockTransaction.mockImplementation(async callback => {
        const tx = {
          message: {
            create: vi
              .fn()
              .mockResolvedValueOnce(userMessage)
              .mockResolvedValueOnce(aiMessage),
          },
          chatSession: {
            update: vi.fn().mockResolvedValue(mockSession),
          },
        };
        return callback(tx as any);
      });

      const result = await MessageService.createMessagePair(
        'User message',
        'AI response',
        mockSessionId,
        mockUserId
      );

      expect(result).toEqual({
        userMessage,
        aiMessage,
      });
    });

    it('should throw error when session not found', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      mockGetChatSessionById.mockResolvedValue(null);

      await expect(
        MessageService.createMessagePair(
          'User message',
          'AI response',
          mockSessionId,
          mockUserId
        )
      ).rejects.toThrow('Chat session not found or access denied');
    });
  });

  describe('getMessageCount', () => {
    it('should return message count for session', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockCount = vi.mocked(db.message.count);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockCount.mockResolvedValue(10);

      const result = await MessageService.getMessageCount(
        mockSessionId,
        mockUserId
      );

      expect(mockCount).toHaveBeenCalledWith({
        where: { sessionId: mockSessionId },
      });
      expect(result).toBe(10);
    });

    it('should throw error when session not found', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      mockGetChatSessionById.mockResolvedValue(null);

      await expect(
        MessageService.getMessageCount(mockSessionId, mockUserId)
      ).rejects.toThrow('Chat session not found or access denied');
    });
  });

  describe('searchMessages', () => {
    it('should search messages by content', async () => {
      const mockFindMany = vi.mocked(db.message.findMany);
      const searchResults = [
        {
          ...mockMessage,
          session: { title: 'Career Planning' },
        },
      ];

      mockFindMany.mockResolvedValue(searchResults);

      const result = await MessageService.searchMessages(mockUserId, 'career', {
        limit: 10,
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          content: { contains: 'career' },
          session: { userId: mockUserId },
        },
        include: {
          session: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 11, // limit + 1
      });

      expect(result.items).toEqual(searchResults);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination in search', async () => {
      const mockFindMany = vi.mocked(db.message.findMany);
      mockFindMany.mockResolvedValue([]);

      await MessageService.searchMessages(mockUserId, 'career', {
        limit: 10,
        cursor: 'cursor-id',
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          content: { contains: 'career' },
          session: { userId: mockUserId },
        },
        include: {
          session: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 11,
        cursor: { id: 'cursor-id' },
        skip: 1,
      });
    });

    it('should return empty results when no matches found', async () => {
      const mockFindMany = vi.mocked(db.message.findMany);
      mockFindMany.mockResolvedValue([]);

      const result = await MessageService.searchMessages(
        mockUserId,
        'nonexistent'
      );

      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockCreate = vi.mocked(db.message.create);

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      const messageData = {
        content: 'Test message',
        role: 'USER' as MessageRole,
        sessionId: mockSessionId,
      };

      await expect(
        MessageService.createMessage(messageData, mockUserId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violations', async () => {
      const mockGetChatSessionById = vi.mocked(
        ChatSessionService.getChatSessionById
      );
      const mockCreate = vi.mocked(db.message.create);

      const constraintError = new Error('Unique constraint failed');
      constraintError.name = 'PrismaClientKnownRequestError';

      mockGetChatSessionById.mockResolvedValue(mockSession);
      mockCreate.mockRejectedValue(constraintError);

      const messageData = {
        content: 'Test message',
        role: 'USER' as MessageRole,
        sessionId: mockSessionId,
      };

      await expect(
        MessageService.createMessage(messageData, mockUserId)
      ).rejects.toThrow('Unique constraint failed');
    });
  });
});
