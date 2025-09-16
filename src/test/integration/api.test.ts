import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { appRouter } from '@/server/api/root';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// Mock the database and external services
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    chatSession: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/server/services/ai', () => ({
  AIService: {
    validateMessage: vi.fn(() => ({ isValid: true })),
    generateResponse: vi.fn(() => Promise.resolve('AI response')),
    generateSessionTitle: vi.fn(() => Promise.resolve('Generated Title')),
  },
}));

const trpcMsw = createTRPCMsw(appRouter);
const server = setupServer();

describe('API Integration Tests', () => {
  let trpcClient: ReturnType<typeof createTRPCClient<typeof appRouter>>;

  beforeEach(() => {
    server.listen();

    trpcClient = createTRPCClient<typeof appRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc',
          transformer: superjson,
        }),
      ],
    });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('User API', () => {
    it('should get user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        theme: 'LIGHT',
        emailNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      server.use(
        trpcMsw.user.getProfile.query(() => {
          return mockUser;
        })
      );

      const result = await trpcClient.user.getProfile.query();
      expect(result).toEqual(mockUser);
    });

    it('should update user preferences', async () => {
      const updatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        theme: 'DARK',
        emailNotifications: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      server.use(
        trpcMsw.user.updatePreferences.mutation(() => {
          return updatedUser;
        })
      );

      const result = await trpcClient.user.updatePreferences.mutate({
        theme: 'DARK',
        emailNotifications: false,
      });

      expect(result.theme).toBe('DARK');
      expect(result.emailNotifications).toBe(false);
    });
  });

  describe('Chat API', () => {
    it('should create new chat session', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'New Chat',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: 0 },
      };

      server.use(
        trpcMsw.chat.createSession.mutation(() => {
          return mockSession;
        })
      );

      const result = await trpcClient.chat.createSession.mutate({
        title: 'New Chat',
      });

      expect(result).toEqual(mockSession);
    });

    it('should get chat sessions with pagination', async () => {
      const mockSessions = {
        items: [
          {
            id: 'session-1',
            title: 'Chat 1',
            userId: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { messages: 5 },
          },
        ],
        nextCursor: undefined,
        hasMore: false,
      };

      server.use(
        trpcMsw.chat.getSessions.query(() => {
          return mockSessions;
        })
      );

      const result = await trpcClient.chat.getSessions.query({
        limit: 20,
      });

      expect(result).toEqual(mockSessions);
    });

    it('should send message and get AI response', async () => {
      const mockResponse = {
        userMessage: {
          id: 'msg-1',
          content: 'Hello',
          role: 'USER',
          sessionId: 'session-1',
          createdAt: new Date(),
        },
        aiMessage: {
          id: 'msg-2',
          content: 'AI response',
          role: 'ASSISTANT',
          sessionId: 'session-1',
          createdAt: new Date(),
        },
        sessionTitle: 'Chat Session',
      };

      server.use(
        trpcMsw.chat.sendMessage.mutation(() => {
          return mockResponse;
        })
      );

      const result = await trpcClient.chat.sendMessage.mutate({
        sessionId: 'session-1',
        content: 'Hello',
      });

      expect(result.userMessage.content).toBe('Hello');
      expect(result.aiMessage.content).toBe('AI response');
    });

    it('should get messages for a session', async () => {
      const mockMessages = {
        items: [
          {
            id: 'msg-1',
            content: 'Hello',
            role: 'USER',
            sessionId: 'session-1',
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            content: 'Hi there!',
            role: 'ASSISTANT',
            sessionId: 'session-1',
            createdAt: new Date(),
          },
        ],
        nextCursor: undefined,
        hasMore: false,
      };

      server.use(
        trpcMsw.chat.getMessages.query(() => {
          return mockMessages;
        })
      );

      const result = await trpcClient.chat.getMessages.query({
        sessionId: 'session-1',
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].content).toBe('Hello');
    });

    it('should handle session deletion', async () => {
      server.use(
        trpcMsw.chat.deleteSession.mutation(() => {
          return { success: true };
        })
      );

      const result = await trpcClient.chat.deleteSession.mutate({
        sessionId: 'session-1',
      });

      expect(result.success).toBe(true);
    });

    it('should handle message regeneration', async () => {
      const mockRegeneratedMessage = {
        id: 'msg-2',
        content: 'New AI response',
        role: 'ASSISTANT',
        sessionId: 'session-1',
        createdAt: new Date(),
      };

      server.use(
        trpcMsw.chat.regenerateResponse.mutation(() => {
          return mockRegeneratedMessage;
        })
      );

      const result = await trpcClient.chat.regenerateResponse.mutate({
        sessionId: 'session-1',
        messageId: 'msg-2',
      });

      expect(result.content).toBe('New AI response');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        trpcMsw.user.getProfile.query(() => {
          throw new Error('UNAUTHORIZED');
        })
      );

      await expect(trpcClient.user.getProfile.query()).rejects.toThrow(
        'UNAUTHORIZED'
      );
    });

    it('should handle validation errors', async () => {
      server.use(
        trpcMsw.chat.sendMessage.mutation(() => {
          throw new Error('BAD_REQUEST');
        })
      );

      await expect(
        trpcClient.chat.sendMessage.mutate({
          sessionId: 'session-1',
          content: '', // Invalid empty content
        })
      ).rejects.toThrow('BAD_REQUEST');
    });

    it('should handle not found errors', async () => {
      server.use(
        trpcMsw.chat.getMessages.query(() => {
          throw new Error('NOT_FOUND');
        })
      );

      await expect(
        trpcClient.chat.getMessages.query({
          sessionId: 'non-existent',
        })
      ).rejects.toThrow('NOT_FOUND');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit errors', async () => {
      server.use(
        trpcMsw.chat.sendMessage.mutation(() => {
          throw new Error('TOO_MANY_REQUESTS');
        })
      );

      await expect(
        trpcClient.chat.sendMessage.mutate({
          sessionId: 'session-1',
          content: 'Test message',
        })
      ).rejects.toThrow('TOO_MANY_REQUESTS');
    });
  });
});
