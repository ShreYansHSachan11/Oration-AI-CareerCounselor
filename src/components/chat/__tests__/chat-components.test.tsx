import { describe, it, expect } from 'vitest';
import { MessageWithStatus } from '@/types/message';

describe('Chat Components Types', () => {
  describe('MessageWithStatus', () => {
    it('should have correct message structure', () => {
      const mockMessage: MessageWithStatus = {
        id: 'msg-1',
        content: 'Hello, I need career advice',
        role: 'USER',
        sessionId: 'session-1',
        createdAt: new Date(),
        status: 'delivered',
      };

      expect(mockMessage.id).toBe('msg-1');
      expect(mockMessage.content).toBe('Hello, I need career advice');
      expect(mockMessage.role).toBe('USER');
      expect(mockMessage.status).toBe('delivered');
    });

    it('should support AI messages', () => {
      const mockAiMessage: MessageWithStatus = {
        id: 'msg-2',
        content: "I'd be happy to help you with career advice!",
        role: 'ASSISTANT',
        sessionId: 'session-1',
        createdAt: new Date(),
        status: 'delivered',
      };

      expect(mockAiMessage.role).toBe('ASSISTANT');
      expect(mockAiMessage.content).toContain('help you with career advice');
    });

    it('should support optimistic messages', () => {
      const optimisticMessage: MessageWithStatus = {
        id: 'temp-123',
        content: 'Sending message...',
        role: 'USER',
        sessionId: 'session-1',
        createdAt: new Date(),
        status: 'sending',
        isOptimistic: true,
      };

      expect(optimisticMessage.isOptimistic).toBe(true);
      expect(optimisticMessage.status).toBe('sending');
    });
  });

  describe('Message Status Types', () => {
    it('should support all status types', () => {
      const statuses: Array<MessageWithStatus['status']> = [
        'sending',
        'sent',
        'delivered',
        'error',
      ];

      statuses.forEach(status => {
        expect(typeof status).toBe('string');
      });
    });
  });
});
