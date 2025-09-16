import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { UserService, ChatSessionService, MessageService } from '../index';
import { DatabaseUtils } from '../../db-utils';
import { db } from '../../db';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
};

describe('Database Services', () => {
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Ensure database connection is healthy
    const isHealthy = await DatabaseUtils.healthCheck();
    expect(isHealthy).toBe(true);
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await UserService.deleteUser(userId).catch(() => {
        // Ignore errors during cleanup
      });
    }
    await DatabaseUtils.disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await db.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe('UserService', () => {
    it('should create a new user', async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;

      expect(user).toBeDefined();
      expect(user.email).toBe(testUser.email);
      expect(user.name).toBe(testUser.name);
      expect(user.theme).toBe('LIGHT');
      expect(user.emailNotifications).toBe(true);
    });

    it('should get user by ID', async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;

      const foundUser = await UserService.getUserById(userId);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(userId);
    });

    it('should get user by email', async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;

      const foundUser = await UserService.getUserByEmail(testUser.email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });

    it('should update user preferences', async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;

      const updatedUser = await UserService.updateUserPreferences(userId, {
        theme: 'DARK',
        emailNotifications: false,
      });

      expect(updatedUser.theme).toBe('DARK');
      expect(updatedUser.emailNotifications).toBe(false);
    });
  });

  describe('ChatSessionService', () => {
    beforeEach(async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;
    });

    it('should create a new chat session', async () => {
      const session = await ChatSessionService.createChatSession({
        userId,
        title: 'Test Session',
      });
      sessionId = session.id;

      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.title).toBe('Test Session');
    });

    it('should get user chat sessions', async () => {
      const session = await ChatSessionService.createChatSession({
        userId,
        title: 'Test Session',
      });
      sessionId = session.id;

      const result = await ChatSessionService.getUserChatSessions(userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(sessionId);
      expect(result.items[0]._count.messages).toBe(0);
    });

    it('should update chat session', async () => {
      const session = await ChatSessionService.createChatSession({
        userId,
        title: 'Test Session',
      });
      sessionId = session.id;

      const updatedSession = await ChatSessionService.updateChatSession(
        sessionId,
        userId,
        { title: 'Updated Session' }
      );

      expect(updatedSession.title).toBe('Updated Session');
    });
  });

  describe('MessageService', () => {
    beforeEach(async () => {
      const user = await UserService.createUser(testUser);
      userId = user.id;

      const session = await ChatSessionService.createChatSession({
        userId,
        title: 'Test Session',
      });
      sessionId = session.id;
    });

    it('should create a new message', async () => {
      const message = await MessageService.createMessage(
        {
          content: 'Hello, world!',
          role: 'USER',
          sessionId,
        },
        userId
      );

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello, world!');
      expect(message.role).toBe('USER');
      expect(message.sessionId).toBe(sessionId);
    });

    it('should get session messages', async () => {
      await MessageService.createMessage(
        {
          content: 'Hello, world!',
          role: 'USER',
          sessionId,
        },
        userId
      );

      const result = await MessageService.getSessionMessages(sessionId, userId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].content).toBe('Hello, world!');
    });

    it('should create message pair', async () => {
      const result = await MessageService.createMessagePair(
        'Hello, AI!',
        'Hello, human!',
        sessionId,
        userId
      );

      expect(result.userMessage.content).toBe('Hello, AI!');
      expect(result.userMessage.role).toBe('USER');
      expect(result.aiMessage.content).toBe('Hello, human!');
      expect(result.aiMessage.role).toBe('ASSISTANT');
    });

    it('should get message count', async () => {
      await MessageService.createMessage(
        {
          content: 'Test message',
          role: 'USER',
          sessionId,
        },
        userId
      );

      const count = await MessageService.getMessageCount(sessionId, userId);
      expect(count).toBe(1);
    });
  });

  describe('DatabaseUtils', () => {
    it('should perform health check', async () => {
      const isHealthy = await DatabaseUtils.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should get database stats', async () => {
      const stats = await DatabaseUtils.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.users).toBe('number');
      expect(typeof stats.sessions).toBe('number');
      expect(typeof stats.messages).toBe('number');
    });
  });
});
