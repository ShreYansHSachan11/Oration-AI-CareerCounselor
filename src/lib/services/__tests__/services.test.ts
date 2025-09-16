import { describe, it, expect } from 'vitest';
import { UserService, ChatSessionService, MessageService } from '../index';
import {
  DatabaseUtils,
  DatabaseError,
  handleDatabaseError,
} from '../../db-utils';

describe('Database Services Structure', () => {
  describe('UserService', () => {
    it('should have all required methods', () => {
      expect(typeof UserService.createUser).toBe('function');
      expect(typeof UserService.getUserById).toBe('function');
      expect(typeof UserService.getUserByEmail).toBe('function');
      expect(typeof UserService.updateUserPreferences).toBe('function');
      expect(typeof UserService.updateUserProfile).toBe('function');
      expect(typeof UserService.deleteUser).toBe('function');
      expect(typeof UserService.getUserWithStats).toBe('function');
    });
  });

  describe('ChatSessionService', () => {
    it('should have all required methods', () => {
      expect(typeof ChatSessionService.createChatSession).toBe('function');
      expect(typeof ChatSessionService.getChatSessionById).toBe('function');
      expect(typeof ChatSessionService.getChatSessionWithMessages).toBe(
        'function'
      );
      expect(typeof ChatSessionService.getUserChatSessions).toBe('function');
      expect(typeof ChatSessionService.updateChatSession).toBe('function');
      expect(typeof ChatSessionService.deleteChatSession).toBe('function');
      expect(typeof ChatSessionService.searchChatSessions).toBe('function');
      expect(typeof ChatSessionService.touchChatSession).toBe('function');
    });
  });

  describe('MessageService', () => {
    it('should have all required methods', () => {
      expect(typeof MessageService.createMessage).toBe('function');
      expect(typeof MessageService.getMessageById).toBe('function');
      expect(typeof MessageService.getSessionMessages).toBe('function');
      expect(typeof MessageService.getRecentMessages).toBe('function');
      expect(typeof MessageService.deleteMessage).toBe('function');
      expect(typeof MessageService.deleteSessionMessages).toBe('function');
      expect(typeof MessageService.createMessagePair).toBe('function');
      expect(typeof MessageService.getMessageCount).toBe('function');
      expect(typeof MessageService.searchMessages).toBe('function');
    });
  });

  describe('DatabaseUtils', () => {
    it('should have all required methods', () => {
      expect(typeof DatabaseUtils.healthCheck).toBe('function');
      expect(typeof DatabaseUtils.getStats).toBe('function');
      expect(typeof DatabaseUtils.cleanupOldSessions).toBe('function');
      expect(typeof DatabaseUtils.getUserActivitySummary).toBe('function');
      expect(typeof DatabaseUtils.disconnect).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should create DatabaseError correctly', () => {
      const error = new DatabaseError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('DatabaseError');
    });

    it('should handle Prisma unique constraint error', () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      };

      expect(() => handleDatabaseError(prismaError)).toThrow(DatabaseError);
      expect(() => handleDatabaseError(prismaError)).toThrow(
        'A record with this information already exists'
      );
    });

    it('should handle Prisma record not found error', () => {
      const prismaError = {
        code: 'P2025',
        message: 'Record not found',
      };

      expect(() => handleDatabaseError(prismaError)).toThrow(DatabaseError);
      expect(() => handleDatabaseError(prismaError)).toThrow(
        'The requested record was not found'
      );
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');

      expect(() => handleDatabaseError(unknownError)).toThrow(DatabaseError);
      expect(() => handleDatabaseError(unknownError)).toThrow(
        'An unexpected error occurred'
      );
    });
  });
});
