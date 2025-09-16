import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '@/server/services/ai';
import { MessageService } from '@/server/services/message';
import { PrismaClient } from '@prisma/client';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'This is a mock AI response for career counseling.',
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Mock Prisma
const mockPrisma = {
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  chatSession: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable for tests
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('generateResponse', () => {
    it('should generate AI response for career counseling', async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'I need help choosing a career path',
        },
      ];

      const response = await AIService.generateResponse(messages);

      expect(response).toBe(
        'This is a mock AI response for career counseling.'
      );
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle empty message array', async () => {
      const messages: any[] = [];

      const response = await AIService.generateResponse(messages);

      expect(response).toBe(
        'This is a mock AI response for career counseling.'
      );
    });
  });

  describe('generateSessionTitle', () => {
    it('should generate session title from first message', async () => {
      const firstMessage =
        'I need help choosing between software engineering and data science';

      const title = await AIService.generateSessionTitle(firstMessage);

      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(50);
    });

    it('should create fallback title when AI fails', async () => {
      // Remove API key to trigger fallback
      delete process.env.OPENAI_API_KEY;

      const firstMessage = 'I need career advice about switching jobs';
      const title = await AIService.generateSessionTitle(firstMessage);

      expect(typeof title).toBe('string');
      expect(title.length).toBeGreaterThan(0);

      // Restore API key
      process.env.OPENAI_API_KEY = 'test-api-key';
    });
  });

  describe('validateMessage', () => {
    it('should validate normal career-related message', () => {
      const message =
        'I want to transition from marketing to tech. What skills should I learn?';
      const result = AIService.validateMessage(message);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject empty message', () => {
      const message = '';
      const result = AIService.validateMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Message cannot be empty');
    });

    it('should reject message that is too long', () => {
      const message = 'a'.repeat(4001);
      const result = AIService.validateMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Message is too long (max 4000 characters)');
    });

    it('should reject harmful content', () => {
      const message = 'I want to kill myself because of my job';
      const result = AIService.validateMessage(message);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain(
        'professional support beyond career counseling'
      );
    });
  });
});

describe('Message Service', () => {
  let messageService: MessageService;

  beforeEach(() => {
    vi.clearAllMocks();
    messageService = new MessageService(mockPrisma);
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const messageData = {
        content: 'Test message',
        role: 'USER' as const,
        sessionId: 'session-123',
      };

      const mockMessage = {
        id: 'msg-123',
        ...messageData,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.message.create).mockResolvedValue(mockMessage);

      const result = await messageService.createMessage(messageData);

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: messageData,
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getSessionMessages', () => {
    it('should get messages for a session with pagination', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';
      const limit = 10;

      const mockSession = { id: sessionId, userId };
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Message 1',
          role: 'USER',
          sessionId,
          createdAt: new Date(),
        },
        {
          id: 'msg-2',
          content: 'Message 2',
          role: 'ASSISTANT',
          sessionId,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockPrisma.chatSession.findFirst).mockResolvedValue(
        mockSession as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue(
        mockMessages as any
      );

      const result = await messageService.getSessionMessages(
        sessionId,
        userId,
        limit
      );

      expect(mockPrisma.chatSession.findFirst).toHaveBeenCalledWith({
        where: { id: sessionId, userId },
      });
      expect(result.items).toEqual(mockMessages);
      expect(result.hasMore).toBe(false);
    });

    it('should throw error for non-existent session', async () => {
      const sessionId = 'non-existent';
      const userId = 'user-123';

      vi.mocked(mockPrisma.chatSession.findFirst).mockResolvedValue(null);

      await expect(
        messageService.getSessionMessages(sessionId, userId)
      ).rejects.toThrow('Chat session not found');
    });
  });

  describe('updateMessage', () => {
    it('should update message content', async () => {
      const messageId = 'msg-123';
      const sessionId = 'session-123';
      const userId = 'user-123';
      const newContent = 'Updated content';

      const mockMessage = {
        id: messageId,
        content: 'Old content',
        role: 'ASSISTANT',
        sessionId,
        createdAt: new Date(),
      };

      const updatedMessage = {
        ...mockMessage,
        content: newContent,
        createdAt: new Date(),
      };

      vi.mocked(mockPrisma.message.findFirst).mockResolvedValue(
        mockMessage as any
      );
      vi.mocked(mockPrisma.message.update).mockResolvedValue(
        updatedMessage as any
      );

      const result = await messageService.updateMessage(
        messageId,
        sessionId,
        userId,
        newContent
      );

      expect(mockPrisma.message.findFirst).toHaveBeenCalledWith({
        where: {
          id: messageId,
          sessionId,
          session: { userId },
        },
      });
      expect(result.content).toBe(newContent);
    });
  });
});
