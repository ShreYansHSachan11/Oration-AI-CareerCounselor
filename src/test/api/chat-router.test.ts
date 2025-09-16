import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatRouter } from '@/server/api/routers/chat';
import { TRPCError } from '@trpc/server';
import type { Session } from 'next-auth';

// Mock dependencies
vi.mock('@/server/services/ai', () => ({
  AIService: {
    validateMessage: vi.fn(),
    generateResponse: vi.fn(),
    generateSessionTitle: vi.fn(),
  },
}));

vi.mock('@/lib/optimized-queries', () => ({
  OptimizedQueries: vi.fn().mockImplementation(() => ({
    getUserSessions: vi.fn(),
    getSessionMessages: vi.fn(),
    getSessionById: vi.fn(),
    updateSessionWithCache: vi.fn(),
    deleteSessionWithCache: vi.fn(),
    searchSessions: vi.fn(),
    getMessageCount: vi.fn(),
    getSessionStats: vi.fn(),
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  messageRateLimiter: { checkLimit: vi.fn() },
  sessionRateLimiter: { checkLimit: vi.fn() },
  searchRateLimiter: { checkLimit: vi.fn() },
}));

vi.mock('@/lib/cache', () => ({
  invalidateSessionCache: vi.fn(),
  invalidateUserCache: vi.fn(),
}));

describe('Chat Router', () => {
  const mockSession: Session = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockPrisma = {
    chatSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  const createTestContext = () => ({
    session: mockSession,
    prisma: mockPrisma,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe;
  ibe('getSessions', () => {
    it('should return user sessions with pagination', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      const mockSessions = {
        items: [
          {
            id: 'session-1',
            title: 'Career Planning',
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { messages: 5 },
          },
        ],
        nextCursor: undefined,
        hasMore: false,
      };

      vi.mocked(mockOptimizedQueries.getUserSessions).mockResolvedValue(
        mockSessions
      );

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.getSessions({
        limit: 20,
      });

      expect(mockOptimizedQueries.getUserSessions).toHaveBeenCalledWith(
        'test-user-id',
        {
          limit: 20,
          cursor: undefined,
          search: undefined,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }
      );
      expect(result).toEqual(mockSessions);
    });

    it('should handle search parameter', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      vi.mocked(mockOptimizedQueries.getUserSessions).mockResolvedValue({
        items: [],
        nextCursor: undefined,
        hasMore: false,
      });

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      await caller.getSessions({
        limit: 20,
        search: 'career',
      });

      expect(mockOptimizedQueries.getUserSessions).toHaveBeenCalledWith(
        'test-user-id',
        {
          limit: 20,
          cursor: undefined,
          search: 'career',
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for valid session', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      const mockMessages = {
        items: [
          {
            id: 'message-1',
            content: 'Hello',
            role: 'USER',
            sessionId: 'session-1',
            createdAt: new Date(),
          },
        ],
        nextCursor: undefined,
        hasMore: false,
      };

      vi.mocked(mockOptimizedQueries.getSessionMessages).mockResolvedValue(
        mockMessages
      );

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.getMessages({
        sessionId: 'session-1',
      });

      expect(result).toEqual(mockMessages);
    });

    it('should throw NOT_FOUND when session not found', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      vi.mocked(mockOptimizedQueries.getSessionMessages).mockRejectedValue(
        new Error('Session not found')
      );

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.getMessages({ sessionId: 'non-existent' })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('createSession', () => {
    it('should create new session with title', async () => {
      const mockSession = {
        id: 'new-session-id',
        title: 'New Session',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: 0 },
      };

      vi.mocked(mockPrisma.chatSession.create).mockResolvedValue(mockSession);

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.createSession({
        title: 'New Session',
      });

      expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({
        data: {
          title: 'New Session',
          userId: 'test-user-id',
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should create session without title', async () => {
      const mockSession = {
        id: 'new-session-id',
        title: null,
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: 0 },
      };

      vi.mocked(mockPrisma.chatSession.create).mockResolvedValue(mockSession);

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.createSession({});

      expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({
        data: {
          title: null,
          userId: 'test-user-id',
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });
    });
  });
  describe('sendMessage', () => {
    it('should send message and get AI response', async () => {
      const { AIService } = await import('@/server/services/ai');
      const { OptimizedQueries } = await import('@/lib/optimized-queries');

      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);
      const mockSession = {
        id: 'session-1',
        title: 'Test Session',
        userId: 'test-user-id',
      };

      const mockUserMessage = {
        id: 'user-msg-1',
        content: 'Hello',
        role: 'USER',
        sessionId: 'session-1',
        createdAt: new Date(),
      };

      const mockAiMessage = {
        id: 'ai-msg-1',
        content: 'Hi there!',
        role: 'ASSISTANT',
        sessionId: 'session-1',
        createdAt: new Date(),
      };

      vi.mocked(AIService.validateMessage).mockReturnValue({ isValid: true });
      vi.mocked(mockOptimizedQueries.getSessionById).mockResolvedValue(
        mockSession
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([]);
      vi.mocked(mockPrisma.message.create)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAiMessage);
      vi.mocked(AIService.generateResponse).mockResolvedValue('Hi there!');
      vi.mocked(mockPrisma.chatSession.update).mockResolvedValue({
        ...mockSession,
        updatedAt: new Date(),
      });

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.sendMessage({
        sessionId: 'session-1',
        content: 'Hello',
      });

      expect(result).toEqual({
        userMessage: mockUserMessage,
        aiMessage: mockAiMessage,
        sessionTitle: 'Test Session',
      });
    });

    it('should validate message content', async () => {
      const { AIService } = await import('@/server/services/ai');

      vi.mocked(AIService.validateMessage).mockReturnValue({
        isValid: false,
        reason: 'Message too long',
      });

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.sendMessage({
          sessionId: 'session-1',
          content: 'Invalid message',
        })
      ).rejects.toThrow('Message too long');
    });

    it('should throw NOT_FOUND when session not found', async () => {
      const { AIService } = await import('@/server/services/ai');
      const { OptimizedQueries } = await import('@/lib/optimized-queries');

      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      vi.mocked(AIService.validateMessage).mockReturnValue({ isValid: true });
      vi.mocked(mockOptimizedQueries.getSessionById).mockResolvedValue(null);

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      await expect(
        caller.sendMessage({
          sessionId: 'non-existent',
          content: 'Hello',
        })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('updateSession', () => {
    it('should update session title', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      const mockSession = {
        id: 'session-1',
        title: 'Old Title',
        userId: 'test-user-id',
      };

      const updatedSession = {
        ...mockSession,
        title: 'New Title',
      };

      vi.mocked(mockOptimizedQueries.getSessionById).mockResolvedValue(
        mockSession
      );
      vi.mocked(mockOptimizedQueries.updateSessionWithCache).mockResolvedValue(
        updatedSession
      );
      vi.mocked(mockOptimizedQueries.getMessageCount).mockResolvedValue(5);

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.updateSession({
        sessionId: 'session-1',
        title: 'New Title',
      });

      expect(result).toEqual({
        ...updatedSession,
        _count: { messages: 5 },
      });
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const { OptimizedQueries } = await import('@/lib/optimized-queries');
      const mockOptimizedQueries = new OptimizedQueries(mockPrisma);

      const mockSession = {
        id: 'session-1',
        title: 'Test Session',
        userId: 'test-user-id',
      };

      vi.mocked(mockOptimizedQueries.getSessionById).mockResolvedValue(
        mockSession
      );
      vi.mocked(
        mockOptimizedQueries.deleteSessionWithCache
      ).mockResolvedValue();

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.deleteSession({
        sessionId: 'session-1',
      });

      expect(result).toEqual({ success: true });
    });
  });

  describe('regenerateResponse', () => {
    it('should regenerate AI response', async () => {
      const { AIService } = await import('@/server/services/ai');

      const mockSession = {
        id: 'session-1',
        userId: 'test-user-id',
      };

      const mockMessage = {
        id: 'ai-msg-1',
        content: 'Old response',
        role: 'ASSISTANT',
        sessionId: 'session-1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      };

      const updatedMessage = {
        ...mockMessage,
        content: 'New response',
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.chatSession.findFirst).mockResolvedValue(
        mockSession
      );
      vi.mocked(mockPrisma.message.findFirst).mockResolvedValue(mockMessage);
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([]);
      vi.mocked(AIService.generateResponse).mockResolvedValue('New response');
      vi.mocked(mockPrisma.message.update).mockResolvedValue(updatedMessage);

      const ctx = createTestContext();
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.regenerateResponse({
        sessionId: 'session-1',
        messageId: 'ai-msg-1',
      });

      expect(result).toEqual(updatedMessage);
    });
  });

  describe('authentication', () => {
    it('should require authentication for all procedures', async () => {
      const ctx = {
        session: null,
        prisma: mockPrisma,
      };

      const caller = chatRouter.createCaller(ctx);

      await expect(caller.getSessions({})).rejects.toThrow('UNAUTHORIZED');
      await expect(caller.getMessages({ sessionId: 'test' })).rejects.toThrow(
        'UNAUTHORIZED'
      );
      await expect(caller.createSession({})).rejects.toThrow('UNAUTHORIZED');
    });
  });
});
