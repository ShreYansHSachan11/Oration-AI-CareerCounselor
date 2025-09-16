import { db } from './db';

/**
 * Database utility functions for common operations
 */
export class DatabaseUtils {
  /**
   * Check if database connection is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    try {
      const [userCount, sessionCount, messageCount] = await Promise.all([
        db.user.count(),
        db.chatSession.count(),
        db.message.count(),
      ]);

      return {
        users: userCount,
        sessions: sessionCount,
        messages: messageCount,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old sessions (older than specified days)
   */
  static async cleanupOldSessions(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await db.chatSession.deleteMany({
        where: {
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              chatSessions: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const messageCount = await db.message.count({
        where: {
          session: {
            userId,
          },
        },
      });

      const lastActivity = await db.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      return {
        userId,
        sessionCount: user._count.chatSessions,
        messageCount,
        lastActivity: lastActivity?.updatedAt || user.createdAt,
        memberSince: user.createdAt,
      };
    } catch (error) {
      console.error('Failed to get user activity summary:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database (useful for cleanup in tests)
   */
  static async disconnect(): Promise<void> {
    await db.$disconnect();
  }
}

/**
 * Error handling utilities for database operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Handle common Prisma errors and convert them to user-friendly messages
 */
export function handleDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };

    switch (prismaError.code) {
      case 'P2002':
        throw new DatabaseError(
          'A record with this information already exists',
          'UNIQUE_CONSTRAINT_VIOLATION',
          error
        );
      case 'P2025':
        throw new DatabaseError(
          'The requested record was not found',
          'RECORD_NOT_FOUND',
          error
        );
      case 'P2003':
        throw new DatabaseError(
          'This operation would violate a data relationship',
          'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          error
        );
      case 'P2014':
        throw new DatabaseError(
          'This operation would violate a required relationship',
          'REQUIRED_RELATION_VIOLATION',
          error
        );
      default:
        throw new DatabaseError(
          'A database error occurred',
          'UNKNOWN_DATABASE_ERROR',
          error
        );
    }
  }

  throw new DatabaseError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    error
  );
}
