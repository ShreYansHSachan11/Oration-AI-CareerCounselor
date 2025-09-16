import { PrismaClient } from '@prisma/client';
import {
  sessionCache,
  messageCache,
  userCache,
  cacheKeys,
  withCache,
  invalidateSessionCache,
  invalidateUserCache,
} from './cache';

export class OptimizedQueries {
  constructor(private prisma: PrismaClient) {}

  // Optimized session queries with caching
  async getUserSessions(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      search?: string;
      sortBy?: 'updatedAt' | 'createdAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      limit = 20,
      cursor,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = options;

    const cacheKey = cacheKeys.userSessions(userId, limit, search);

    return withCache(
      cacheKey,
      async () => {
        // Build optimized where clause
        const whereClause: any = { userId };

        if (search) {
          whereClause.OR = [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              messages: {
                some: {
                  content: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ];
        }

        // Use optimized query with proper indexing
        const sessions = await this.prisma.chatSession.findMany({
          where: whereClause,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { messages: true },
            },
            // Only include recent message for preview if needed
            messages: search
              ? {
                  where: {
                    content: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    content: true,
                    createdAt: true,
                  },
                }
              : false,
          },
        });

        let nextCursor: string | undefined = undefined;
        if (sessions.length > limit) {
          const nextItem = sessions.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items: sessions,
          nextCursor,
          hasMore: !!nextCursor,
        };
      },
      sessionCache,
      2 * 60 * 1000 // 2 minutes cache
    );
  }

  // Optimized message queries with caching
  async getSessionMessages(
    sessionId: string,
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
    } = {}
  ) {
    const { limit = 50, cursor } = options;

    // First verify session ownership (cached)
    const session = await this.getSessionById(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cacheKey = cacheKeys.sessionMessages(sessionId, limit, cursor);

    return withCache(
      cacheKey,
      async () => {
        const messages = await this.prisma.message.findMany({
          where: { sessionId },
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            createdAt: true,
          },
        });

        let nextCursor: string | undefined = undefined;
        if (messages.length > limit) {
          const nextItem = messages.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items: messages,
          nextCursor,
          hasMore: !!nextCursor,
        };
      },
      messageCache,
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  // Optimized session lookup with caching
  async getSessionById(sessionId: string, userId: string) {
    const cacheKey = `session:${sessionId}:${userId}`;

    return withCache(
      cacheKey,
      async () => {
        return this.prisma.chatSession.findFirst({
          where: { id: sessionId, userId },
          select: {
            id: true,
            title: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      },
      sessionCache,
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  // Optimized user profile with caching
  async getUserProfile(userId: string) {
    const cacheKey = cacheKeys.userProfile(userId);

    return withCache(
      cacheKey,
      async () => {
        return this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            theme: true,
            emailNotifications: true,
            createdAt: true,
          },
        });
      },
      userCache,
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  // Optimized session statistics with caching
  async getSessionStats(userId: string) {
    const cacheKey = cacheKeys.sessionStats(userId);

    return withCache(
      cacheKey,
      async () => {
        // Use a single query with aggregations for better performance
        const [totalSessions, totalMessages, recentSessions] =
          await Promise.all([
            this.prisma.chatSession.count({
              where: { userId },
            }),
            this.prisma.message.count({
              where: {
                session: { userId },
              },
            }),
            this.prisma.chatSession.count({
              where: {
                userId,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            }),
          ]);

        return {
          totalSessions,
          totalMessages,
          recentSessions,
        };
      },
      userCache,
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  // Optimized search with caching
  async searchSessions(
    userId: string,
    query: string,
    options: {
      limit?: number;
      cursor?: string;
      includeMessages?: boolean;
    } = {}
  ) {
    const { limit = 20, cursor, includeMessages = false } = options;
    const cacheKey = cacheKeys.searchResults(userId, query, limit);

    return withCache(
      cacheKey,
      async () => {
        const sessions = await this.prisma.chatSession.findMany({
          where: {
            userId,
            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                messages: {
                  some: {
                    content: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          },
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { messages: true },
            },
            ...(includeMessages && {
              messages: {
                where: {
                  content: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  content: true,
                  role: true,
                  createdAt: true,
                },
              },
            }),
          },
        });

        let nextCursor: string | undefined = undefined;
        if (sessions.length > limit) {
          const nextItem = sessions.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items: sessions,
          nextCursor,
          hasMore: !!nextCursor,
        };
      },
      messageCache,
      3 * 60 * 1000 // 3 minutes cache for search results
    );
  }

  // Optimized message count with caching
  async getMessageCount(sessionId: string, userId: string) {
    // Verify session ownership first
    const session = await this.getSessionById(sessionId, userId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cacheKey = cacheKeys.messageCount(sessionId);

    return withCache(
      cacheKey,
      async () => {
        return this.prisma.message.count({
          where: { sessionId },
        });
      },
      messageCache,
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  // Batch operations for better performance
  async batchGetSessions(sessionIds: string[], userId: string) {
    // Check cache first
    const cached: any[] = [];
    const uncachedIds: string[] = [];

    for (const id of sessionIds) {
      const cacheKey = `session:${id}:${userId}`;
      const cachedSession = sessionCache.get(cacheKey);
      if (cachedSession) {
        cached.push(cachedSession);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached sessions in batch
    let uncachedSessions: any[] = [];
    if (uncachedIds.length > 0) {
      uncachedSessions = await this.prisma.chatSession.findMany({
        where: {
          id: { in: uncachedIds },
          userId,
        },
        select: {
          id: true,
          title: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Cache the results
      uncachedSessions.forEach(session => {
        const cacheKey = `session:${session.id}:${userId}`;
        sessionCache.set(cacheKey, session, 10 * 60 * 1000);
      });
    }

    return [...cached, ...uncachedSessions];
  }

  // Transaction-based operations with cache invalidation
  async createSessionWithMessage(
    userId: string,
    title: string | null,
    messageContent: string
  ) {
    const result = await this.prisma.$transaction(async tx => {
      // Create session
      const session = await tx.chatSession.create({
        data: {
          title,
          userId,
        },
      });

      // Create initial message
      const message = await tx.message.create({
        data: {
          content: messageContent,
          role: 'USER',
          sessionId: session.id,
        },
      });

      return { session, message };
    });

    // Invalidate relevant caches
    invalidateUserCache(userId);

    return result;
  }

  async updateSessionWithCache(
    sessionId: string,
    userId: string,
    updates: { title?: string }
  ) {
    const session = await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: updates,
    });

    // Invalidate caches
    invalidateSessionCache(sessionId);
    invalidateUserCache(userId);

    return session;
  }

  async deleteSessionWithCache(sessionId: string, userId: string) {
    await this.prisma.chatSession.delete({
      where: { id: sessionId },
    });

    // Invalidate caches
    invalidateSessionCache(sessionId);
    invalidateUserCache(userId);
  }
}
