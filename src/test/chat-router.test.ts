import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appRouter } from '@/server/api/root';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

// Mock session for testing
const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Create test context directly without NextAuth dependencies
const createTestContext = () => {
  return {
    session: mockSession,
    prisma,
  };
};

describe('Chat Router', () => {
  let testUserId: string;
  let testSessionId: string;

  beforeEach(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.message.deleteMany({
      where: { session: { userId: testUserId } },
    });
    await prisma.chatSession.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.createSession({
        title: 'Test Session',
      });

      expect(result).toMatchObject({
        title: 'Test Session',
        userId: testUserId,
        _count: { messages: 0 },
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      testSessionId = result.id;
    });

    it('should create a session without title', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.createSession({});

      expect(result).toMatchObject({
        title: null,
        userId: testUserId,
        _count: { messages: 0 },
      });
    });
  });

  describe('getSessions', () => {
    beforeEach(async () => {
      // Create test sessions
      const session1 = await prisma.chatSession.create({
        data: {
          title: 'First Session',
          userId: testUserId,
        },
      });

      const session2 = await prisma.chatSession.create({
        data: {
          title: 'Second Session',
          userId: testUserId,
        },
      });

      testSessionId = session1.id;

      // Add some messages to test search functionality
      await prisma.message.create({
        data: {
          content: 'Hello career counselor',
          role: 'USER',
          sessionId: session1.id,
        },
      });

      await prisma.message.create({
        data: {
          content: 'How can I help with your career goals?',
          role: 'ASSISTANT',
          sessionId: session1.id,
        },
      });
    });

    it('should get user sessions with pagination', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getSessions({
        limit: 10,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        title: expect.any(String),
        userId: testUserId,
        _count: { messages: expect.any(Number) },
      });
      expect(result.hasMore).toBe(false);
    });

    it('should search sessions by title', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getSessions({
        limit: 10,
        search: 'First',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('First Session');
    });

    it('should search sessions by message content', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getSessions({
        limit: 10,
        search: 'career counselor',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('First Session');
    });

    it('should sort sessions by different fields', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getSessions({
        limit: 10,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].title).toBe('First Session');
      expect(result.items[1].title).toBe('Second Session');
    });
  });

  describe('searchSessions', () => {
    beforeEach(async () => {
      const session = await prisma.chatSession.create({
        data: {
          title: 'Career Planning Session',
          userId: testUserId,
        },
      });

      testSessionId = session.id;

      await prisma.message.create({
        data: {
          content: 'I need help with software engineering career path',
          role: 'USER',
          sessionId: session.id,
        },
      });
    });

    it('should search sessions and return matching results', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.searchSessions({
        query: 'software engineering',
        includeMessages: true,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Career Planning Session');
      expect(result.items[0].messages).toBeDefined();
      expect(result.items[0].messages![0].content).toContain(
        'software engineering'
      );
    });
  });

  describe('updateSession', () => {
    beforeEach(async () => {
      const session = await prisma.chatSession.create({
        data: {
          title: 'Original Title',
          userId: testUserId,
        },
      });
      testSessionId = session.id;
    });

    it('should update session title', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.updateSession({
        sessionId: testSessionId,
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.id).toBe(testSessionId);
    });

    it('should throw error for non-existent session', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.chat.updateSession({
          sessionId: 'non-existent-id',
          title: 'Updated Title',
        })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('deleteSession', () => {
    beforeEach(async () => {
      const session = await prisma.chatSession.create({
        data: {
          title: 'Session to Delete',
          userId: testUserId,
        },
      });
      testSessionId = session.id;
    });

    it('should delete session successfully', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.deleteSession({
        sessionId: testSessionId,
      });

      expect(result.success).toBe(true);

      // Verify session is deleted
      const deletedSession = await prisma.chatSession.findUnique({
        where: { id: testSessionId },
      });
      expect(deletedSession).toBeNull();
    });

    it('should throw error for non-existent session', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.chat.deleteSession({
          sessionId: 'non-existent-id',
        })
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('getSessionStats', () => {
    beforeEach(async () => {
      // Create test sessions and messages
      const session1 = await prisma.chatSession.create({
        data: {
          title: 'Session 1',
          userId: testUserId,
        },
      });

      const session2 = await prisma.chatSession.create({
        data: {
          title: 'Session 2',
          userId: testUserId,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        },
      });

      await prisma.message.createMany({
        data: [
          {
            content: 'Message 1',
            role: 'USER',
            sessionId: session1.id,
          },
          {
            content: 'Message 2',
            role: 'ASSISTANT',
            sessionId: session1.id,
          },
          {
            content: 'Message 3',
            role: 'USER',
            sessionId: session2.id,
          },
        ],
      });
    });

    it('should return correct session statistics', async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.getSessionStats();

      expect(result).toMatchObject({
        totalSessions: 2,
        totalMessages: 3,
        recentSessions: 1, // Only session1 is within last 7 days
      });
    });
  });
});
