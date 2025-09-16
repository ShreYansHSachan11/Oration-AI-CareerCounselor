import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatSessionService } from '@/lib/services/chat-session.service';
import { prisma } from '@/lib/prisma';
import type { ChatSession, Message } from '@prisma/client';

// Mock the database
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chatSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('ChatSessionService', () => {
  const mockUserId = 'test-user-id';
  const mockSessionId = 'test-session-id';

  const mockChatSession: ChatSession = {
    id: mockSessionId,
    title: 'Test Session',
    userId: mockUserId,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const mockMessage: Message = {
    id: 'message-1',
    content: 'Hello',
    role: 'USER',
    sessionId: mockSessionId,
    createdAt: new Date('2024-01-01T10:01:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChatSession', () => {
    it('should create a new chat session', async () => {
      const mockCreate = vi.mocked(prisma.chatSession.create);
      mockCreate.mockResolvedValue(mockChatSession);

      const result = await ChatSessionService.createChatSession({
        userId: mockUserId,
        title: 'Test Session',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          title: 'Test Session',
        },
      });
      expect(result).toEqual(mockChatSession);
    });

    it('should create a session without title', async () => {
      const mockCreate = vi.mocked(prisma.chatSession.create);
      const sessionWithoutTitle = { ...mockChatSession, title: undefined };
      mockCreate.mockResolvedValue(sessionWithoutTitle);

      const result = await ChatSessionService.createChatSession({
        userId: mockUserId,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
        },
      });
      expect(result).toEqual(sessionWithoutTitle);
    });
  });

  describe('getChatSessionById', () => {
    it('should return chat session when found', async () => {
      const mockFindFirst = vi.mocked(prisma.chatSession.findFirst);
      mockFindFirst.mockResolvedValue(mockChatSession);

      const result = await ChatSessionService.getChatSessionById(
        mockSessionId,
        mockUserId
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(mockChatSession);
    });

    it('should return null when session not found', async () => {
      const mockFindFirst = vi.mocked(prisma.chatSession.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await ChatSessionService.getChatSessionById(
        'non-existent',
        mockUserId
      );

      expect(result).toBeNull();
    });

    it('should return null when session belongs to different user', async () => {
      const mockFindFirst = vi.mocked(prisma.chatSession.findFirst);
      mockFindFirst.mockResolvedValue(null);

      const result = await ChatSessionService.getChatSessionById(
        mockSessionId,
        'different-user'
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: 'different-user',
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('getChatSessionWithMessages', () => {
    it('should return session with messages', async () => {
      const mockFindFirst = vi.mocked(prisma.chatSession.findFirst);
      const sessionWithMessages = {
        ...mockChatSession,
        messages: [mockMessage],
      };
      mockFindFirst.mockResolvedValue(sessionWithMessages);

      const result = await ChatSessionService.getChatSessionWithMessages(
        mockSessionId,
        mockUserId
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
      expect(result).toEqual(sessionWithMessages);
    });
  });

  describe('getUserChatSessions', () => {
    it('should return paginated user sessions', async () => {
      const mockFindMany = vi.mocked(prisma.chatSession.findMany);
      const sessionsWithCount = [
        {
          ...mockChatSession,
          _count: { messages: 5 },
        },
      ];
      mockFindMany.mockResolvedValue(sessionsWithCount);

      const result = await ChatSessionService.getUserChatSessions(mockUserId, {
        limit: 20,
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
        take: 21, // limit + 1
      });

      expect(result).toEqual({
        items: sessionsWithCount,
        nextCursor: undefined,
        hasMore: false,
      });
    });

    it('should handle pagination with cursor', async () => {
      const mockFindMany = vi.mocked(prisma.chatSession.findMany);
      const sessionsWithCount = [
        {
          ...mockChatSession,
          _count: { messages: 5 },
        },
      ];
      mockFindMany.mockResolvedValue(sessionsWithCount);

      const result = await ChatSessionService.getUserChatSessions(mockUserId, {
        limit: 20,
        cursor: 'cursor-id',
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
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
        take: 21,
        cursor: {
          id: 'cursor-id',
        },
        skip: 1,
      });
    });

    it('should indicate when there are more results', async () => {
      const mockFindMany = vi.mocked(prisma.chatSession.findMany);
      const sessionsWithCount = Array.from({ length: 21 }, (_, i) => ({
        ...mockChatSession,
        id: `session-${i}`,
        _count: { messages: i },
      }));
      mockFindMany.mockResolvedValue(sessionsWithCount);

      const result = await ChatSessionService.getUserChatSessions(mockUserId, {
        limit: 20,
      });

      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe('session-18'); // Second to last item
    });
  });

  describe('updateChatSession', () => {
    it('should update session title', async () => {
      const mockUpdate = vi.mocked(prisma.chatSession.update);
      const updatedSession = { ...mockChatSession, title: 'Updated Title' };
      mockUpdate.mockResolvedValue(updatedSession);

      const result = await ChatSessionService.updateChatSession(
        mockSessionId,
        mockUserId,
        { title: 'Updated Title' }
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
        data: {
          title: 'Updated Title',
        },
      });
      expect(result).toEqual(updatedSession);
    });

    it('should handle empty update data', async () => {
      const mockUpdate = vi.mocked(prisma.chatSession.update);
      mockUpdate.mockResolvedValue(mockChatSession);

      const result = await ChatSessionService.updateChatSession(
        mockSessionId,
        mockUserId,
        {}
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
        data: {},
      });
    });
  });

  describe('deleteChatSession', () => {
    it('should delete session', async () => {
      const mockDelete = vi.mocked(prisma.chatSession.delete);
      mockDelete.mockResolvedValue(mockChatSession);

      await ChatSessionService.deleteChatSession(mockSessionId, mockUserId);

      expect(mockDelete).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
      });
    });

    it('should throw error when session not found', async () => {
      const mockDelete = vi.mocked(prisma.chatSession.delete);
      mockDelete.mockRejectedValue(new Error('Record not found'));

      await expect(
        ChatSessionService.deleteChatSession('non-existent', mockUserId)
      ).rejects.toThrow('Record not found');
    });
  });

  describe('searchChatSessions', () => {
    it('should search sessions by title', async () => {
      const mockFindMany = vi.mocked(prisma.chatSession.findMany);
      const searchResults = [
        {
          ...mockChatSession,
          title: 'Career Planning Session',
          _count: { messages: 3 },
        },
      ];
      mockFindMany.mockResolvedValue(searchResults);

      const result = await ChatSessionService.searchChatSessions(
        mockUserId,
        'Career',
        { limit: 10 }
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          title: {
            contains: 'Career',
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
        take: 11,
      });

      expect(result.items).toEqual(searchResults);
    });

    it('should return empty results when no matches found', async () => {
      const mockFindMany = vi.mocked(prisma.chatSession.findMany);
      mockFindMany.mockResolvedValue([]);

      const result = await ChatSessionService.searchChatSessions(
        mockUserId,
        'NonExistent',
        { limit: 10 }
      );

      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('touchChatSession', () => {
    it('should update session timestamp', async () => {
      const mockUpdate = vi.mocked(prisma.chatSession.update);
      const touchedSession = {
        ...mockChatSession,
        updatedAt: new Date('2024-01-01T11:00:00Z'),
      };
      mockUpdate.mockResolvedValue(touchedSession);

      await ChatSessionService.touchChatSession(mockSessionId, mockUserId);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: {
          id: mockSessionId,
          userId: mockUserId,
        },
        data: {
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const mockCreate = vi.mocked(prisma.chatSession.create);
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        ChatSessionService.createChatSession({
          userId: mockUserId,
          title: 'Test Session',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violations', async () => {
      const mockCreate = vi.mocked(prisma.chatSession.create);
      const constraintError = new Error('Unique constraint failed');
      constraintError.name = 'PrismaClientKnownRequestError';
      mockCreate.mockRejectedValue(constraintError);

      await expect(
        ChatSessionService.createChatSession({
          userId: mockUserId,
          title: 'Test Session',
        })
      ).rejects.toThrow('Unique constraint failed');
    });
  });
});
