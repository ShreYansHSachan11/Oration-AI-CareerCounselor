import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatSessionService } from '@/lib/services/chat-session.service';
import { MessageService } from '@/lib/services/message.service';
import { UserService } from '@/lib/services/user.service';

// Mock the database with in-memory implementation for integration tests
const mockDatabase = {
  users: new Map(),
  chatSessions: new Map(),
  messages: new Map(),
};

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(({ data }) => {
        const user = {
          id: `user-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDatabase.users.set(user.id, user);
        return Promise.resolve(user);
      }),
      findUnique: vi.fn(({ where }) => {
        const user = mockDatabase.users.get(where.id) || null;
        return Promise.resolve(user);
      }),
      update: vi.fn(({ where, data }) => {
        const user = mockDatabase.users.get(where.id);
        if (!user) throw new Error('User not found');
        const updated = { ...user, ...data, updatedAt: new Date() };
        mockDatabase.users.set(user.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn(({ where }) => {
        const user = mockDatabase.users.get(where.id);
        if (!user) throw new Error('User not found');
        mockDatabase.users.delete(where.id);
        return Promise.resolve(user);
      }),
    },
    chatSession: {
      create: vi.fn(({ data }) => {
        const session = {
          id: `session-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDatabase.chatSessions.set(session.id, session);
        return Promise.resolve(session);
      }),
      findFirst: vi.fn(({ where }) => {
        for (const session of mockDatabase.chatSessions.values()) {
          if (session.id === where.id && session.userId === where.userId) {
            return Promise.resolve(session);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn(({ where, take, orderBy }) => {
        const sessions = Array.from(mockDatabase.chatSessions.values())
          .filter(session => session.userId === where.userId)
          .sort((a, b) => {
            if (orderBy?.updatedAt === 'desc') {
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            }
            return (
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            );
          });

        if (take) {
          return Promise.resolve(sessions.slice(0, take));
        }
        return Promise.resolve(sessions);
      }),
      update: vi.fn(({ where, data }) => {
        const session = mockDatabase.chatSessions.get(where.id);
        if (!session || session.userId !== where.userId) {
          throw new Error('Session not found');
        }
        const updated = { ...session, ...data, updatedAt: new Date() };
        mockDatabase.chatSessions.set(session.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn(({ where }) => {
        const session = mockDatabase.chatSessions.get(where.id);
        if (!session || session.userId !== where.userId) {
          throw new Error('Session not found');
        }
        mockDatabase.chatSessions.delete(where.id);
        return Promise.resolve(session);
      }),
    },
    message: {
      create: vi.fn(({ data }) => {
        const message = {
          id: `msg-${Date.now()}`,
          ...data,
          createdAt: new Date(),
        };
        mockDatabase.messages.set(message.id, message);
        return Promise.resolve(message);
      }),
      findMany: vi.fn(({ where, orderBy, take }) => {
        const messages = Array.from(mockDatabase.messages.values())
          .filter(msg => msg.sessionId === where.sessionId)
          .sort((a, b) => {
            if (orderBy?.createdAt === 'desc') {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

        if (take) {
          return Promise.resolve(messages.slice(0, take));
        }
        return Promise.resolve(messages);
      }),
      findFirst: vi.fn(({ where }) => {
        for (const message of mockDatabase.messages.values()) {
          if (message.id === where.id) {
            return Promise.resolve(message);
          }
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn(({ where }) => {
        const message = mockDatabase.messages.get(where.id);
        if (!message) throw new Error('Message not found');
        mockDatabase.messages.delete(where.id);
        return Promise.resolve(message);
      }),
      count: vi.fn(({ where }) => {
        const count = Array.from(mockDatabase.messages.values()).filter(
          msg => msg.sessionId === where.sessionId
        ).length;
        return Promise.resolve(count);
      }),
    },
    $transaction: vi.fn(async callback => {
      // Simple transaction mock - just execute the callback
      return callback({
        message: {
          create: vi.fn(({ data }) => {
            const message = {
              id: `msg-${Date.now()}-${Math.random()}`,
              ...data,
              createdAt: new Date(),
            };
            mockDatabase.messages.set(message.id, message);
            return Promise.resolve(message);
          }),
        },
        chatSession: {
          update: vi.fn(({ where, data }) => {
            const session = mockDatabase.chatSessions.get(where.id);
            if (!session) throw new Error('Session not found');
            const updated = { ...session, ...data, updatedAt: new Date() };
            mockDatabase.chatSessions.set(session.id, updated);
            return Promise.resolve(updated);
          }),
        },
      });
    }),
  },
}));

describe('Database Integration Tests', () => {
  const testUserId = 'test-user-123';
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    // Clear mock database
    mockDatabase.users.clear();
    mockDatabase.chatSessions.clear();
    mockDatabase.messages.clear();

    // Create test user
    mockDatabase.users.set(testUserId, {
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Service Integration', () => {
    it('should create and retrieve user', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
      };

      const createdUser = await UserService.createUser(userData);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.id).toBeDefined();

      const retrievedUser = await UserService.getUserById(createdUser.id);
      expect(retrievedUser).toEqual(createdUser);
    });

    it('should update user preferences', async () => {
      const updatedUser = await UserService.updateUserPreferences(testUserId, {
        theme: 'DARK',
        emailNotifications: false,
      });

      expect(updatedUser.theme).toBe('DARK');
      expect(updatedUser.emailNotifications).toBe(false);
    });
  });

  describe('Chat Session Service Integration', () => {
    it('should create and manage chat sessions', async () => {
      // Create session
      const session = await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Test Session',
      });

      expect(session.userId).toBe(testUserId);
      expect(session.title).toBe('Test Session');
      expect(session.id).toBeDefined();

      // Retrieve session
      const retrievedSession = await ChatSessionService.getChatSessionById(
        session.id,
        testUserId
      );
      expect(retrievedSession).toEqual(session);

      // Update session
      const updatedSession = await ChatSessionService.updateChatSession(
        session.id,
        testUserId,
        { title: 'Updated Title' }
      );
      expect(updatedSession.title).toBe('Updated Title');

      // List user sessions
      const userSessions =
        await ChatSessionService.getUserChatSessions(testUserId);
      expect(userSessions.items).toHaveLength(1);
      expect(userSessions.items[0].title).toBe('Updated Title');
    });

    it('should handle session access control', async () => {
      const session = await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Private Session',
      });

      // Different user should not access session
      const otherUserId = 'other-user-456';
      const result = await ChatSessionService.getChatSessionById(
        session.id,
        otherUserId
      );
      expect(result).toBeNull();
    });

    it('should search sessions by title', async () => {
      await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Career Planning Session',
      });

      await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Interview Preparation',
      });

      const searchResults = await ChatSessionService.searchChatSessions(
        testUserId,
        'Career',
        { limit: 10 }
      );

      expect(searchResults.items).toHaveLength(1);
      expect(searchResults.items[0].title).toBe('Career Planning Session');
    });
  });

  describe('Message Service Integration', () => {
    let sessionId: string;

    beforeEach(async () => {
      const session = await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Message Test Session',
      });
      sessionId = session.id;
    });

    it('should create and retrieve messages', async () => {
      // Create user message
      const userMessage = await MessageService.createMessage(
        {
          content: 'Hello, I need career advice',
          role: 'USER',
          sessionId,
        },
        testUserId
      );

      expect(userMessage.content).toBe('Hello, I need career advice');
      expect(userMessage.role).toBe('USER');
      expect(userMessage.sessionId).toBe(sessionId);

      // Create AI message
      const aiMessage = await MessageService.createMessage(
        {
          content: "I'd be happy to help!",
          role: 'ASSISTANT',
          sessionId,
        },
        testUserId
      );

      // Retrieve session messages
      const messages = await MessageService.getSessionMessages(
        sessionId,
        testUserId
      );

      expect(messages.items).toHaveLength(2);
      expect(messages.items[0].role).toBe('USER');
      expect(messages.items[1].role).toBe('ASSISTANT');
    });

    it('should create message pairs in transaction', async () => {
      const result = await MessageService.createMessagePair(
        'User question',
        'AI response',
        sessionId,
        testUserId
      );

      expect(result.userMessage.content).toBe('User question');
      expect(result.userMessage.role).toBe('USER');
      expect(result.aiMessage.content).toBe('AI response');
      expect(result.aiMessage.role).toBe('ASSISTANT');

      // Verify both messages are in the session
      const messages = await MessageService.getSessionMessages(
        sessionId,
        testUserId
      );
      expect(messages.items).toHaveLength(2);
    });

    it('should handle message pagination', async () => {
      // Create multiple messages
      for (let i = 0; i < 25; i++) {
        await MessageService.createMessage(
          {
            content: `Message ${i}`,
            role: i % 2 === 0 ? 'USER' : 'ASSISTANT',
            sessionId,
          },
          testUserId
        );
      }

      // Get first page
      const firstPage = await MessageService.getSessionMessages(
        sessionId,
        testUserId,
        { limit: 10 }
      );

      expect(firstPage.items).toHaveLength(10);
      expect(firstPage.hasMore).toBe(true);
      expect(firstPage.nextCursor).toBeDefined();

      // Get second page
      const secondPage = await MessageService.getSessionMessages(
        sessionId,
        testUserId,
        { limit: 10, cursor: firstPage.nextCursor }
      );

      expect(secondPage.items).toHaveLength(10);
      expect(secondPage.hasMore).toBe(true);
    });

    it('should get message count', async () => {
      await MessageService.createMessage(
        { content: 'Message 1', role: 'USER', sessionId },
        testUserId
      );
      await MessageService.createMessage(
        { content: 'Message 2', role: 'ASSISTANT', sessionId },
        testUserId
      );

      const count = await MessageService.getMessageCount(sessionId, testUserId);
      expect(count).toBe(2);
    });

    it('should search messages by content', async () => {
      await MessageService.createMessage(
        { content: 'I need career advice', role: 'USER', sessionId },
        testUserId
      );
      await MessageService.createMessage(
        { content: 'What about salary negotiation?', role: 'USER', sessionId },
        testUserId
      );

      const searchResults = await MessageService.searchMessages(
        testUserId,
        'career'
      );

      expect(searchResults.items).toHaveLength(1);
      expect(searchResults.items[0].content).toBe('I need career advice');
    });
  });

  describe('Cross-Service Integration', () => {
    it('should handle complete chat workflow', async () => {
      // Create session
      const session = await ChatSessionService.createChatSession({
        userId: testUserId,
        title: 'Complete Workflow Test',
      });

      // Add messages
      await MessageService.createMessagePair(
        'What career should I choose?',
        'Consider your interests and skills...',
        session.id,
        testUserId
      );

      // Update session timestamp
      await ChatSessionService.touchChatSession(session.id, testUserId);

      // Verify session has messages
      const sessionWithMessages =
        await ChatSessionService.getChatSessionWithMessages(
          session.id,
          testUserId
        );

      expect(sessionWithMessages?.messages).toHaveLength(2);

      // Get message count
      const messageCount = await MessageService.getMessageCount(
        session.id,
        testUserId
      );
      expect(messageCount).toBe(2);

      // Clean up - delete session
      await ChatSessionService.deleteChatSession(session.id, testUserId);

      // Verify session is deleted
      const deletedSession = await ChatSessionService.getChatSessionById(
        session.id,
        testUserId
      );
      expect(deletedSession).toBeNull();
    });
  });
});
