import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { AIService } from '@/server/services/ai';
import { MessageService } from '@/server/services/message';
import { OptimizedQueries } from '@/lib/optimized-queries';
import {
  messageRateLimiter,
  sessionRateLimiter,
  searchRateLimiter,
  createRateLimitMiddleware,
} from '@/lib/rate-limit';
import {
  sessionCache,
  messageCache,
  invalidateSessionCache,
  invalidateUserCache,
} from '@/lib/cache';

export const chatRouter = createTRPCRouter({
  // Get user's chat sessions with pagination and search
  getSessions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
        sortBy: z
          .enum(['updatedAt', 'createdAt', 'title'])
          .default('updatedAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .use(async opts => {
      // Apply rate limiting
      await sessionRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'getSessions'
      );
      return opts.next();
    })
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, sortBy, sortOrder } = input;
      const userId = ctx.session.user.id;

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      return optimizedQueries.getUserSessions(userId, {
        limit,
        cursor,
        search,
        sortBy,
        sortOrder,
      });
    }),

  // Get messages for a specific session
  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .use(async opts => {
      // Apply rate limiting
      await messageRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'getMessages'
      );
      return opts.next();
    })
    .query(async ({ ctx, input }) => {
      const { sessionId, limit, cursor } = input;
      const userId = ctx.session.user.id;

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      try {
        return await optimizedQueries.getSessionMessages(sessionId, userId, {
          limit,
          cursor,
        });
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }
    }),

  // Create new chat session
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const session = await ctx.prisma.chatSession.create({
        data: {
          title: input.title || null,
          userId,
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return session;
    }),

  // Send message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1).max(4000),
      })
    )
    .use(async opts => {
      // Apply rate limiting for message sending
      await messageRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'sendMessage'
      );
      return opts.next();
    })
    .mutation(async ({ ctx, input }) => {
      const { sessionId, content } = input;
      const userId = ctx.session.user.id;

      // Validate message content
      const validation = AIService.validateMessage(content);
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.reason || 'Invalid message content',
        });
      }

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      // Verify the session belongs to the user (cached)
      const session = await optimizedQueries.getSessionById(sessionId, userId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      // Get recent messages for context (cached)
      const recentMessages = await ctx.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      try {
        // Create user message first
        const userMessage = await ctx.prisma.message.create({
          data: {
            content,
            role: 'USER',
            sessionId,
          },
        });

        // Prepare conversation history for AI
        const conversationHistory = recentMessages.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        }));

        // Add the new user message to history
        conversationHistory.push({
          role: 'user',
          content,
        });

        // Generate AI response
        const aiResponse =
          await AIService.generateResponse(conversationHistory);

        // Create AI message
        const aiMessage = await ctx.prisma.message.create({
          data: {
            content: aiResponse,
            role: 'ASSISTANT',
            sessionId,
          },
        });

        // Update session timestamp and title if needed
        const updateData: any = { updatedAt: new Date() };

        // If this is the first message and session has no title, generate one
        if (!session.title && recentMessages.length === 0) {
          try {
            const generatedTitle =
              await AIService.generateSessionTitle(content);
            updateData.title = generatedTitle;
          } catch (error) {
            console.error('Failed to generate session title:', error);
            // Continue without title if generation fails
          }
        }

        const updatedSession = await ctx.prisma.chatSession.update({
          where: { id: sessionId },
          data: updateData,
        });

        // Invalidate caches after successful message creation
        invalidateSessionCache(sessionId);
        invalidateUserCache(userId);

        return {
          userMessage,
          aiMessage,
          sessionTitle: updatedSession.title,
        };
      } catch (error) {
        // If AI service fails, still save the user message but return error
        console.error('AI service error:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate AI response. Please try again.',
        });
      }
    }),

  // Update session title
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        title: z.string().min(1).max(100),
      })
    )
    .use(async opts => {
      // Apply rate limiting
      await sessionRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'updateSession'
      );
      return opts.next();
    })
    .mutation(async ({ ctx, input }) => {
      const { sessionId, title } = input;
      const userId = ctx.session.user.id;

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      // Verify the session belongs to the user (cached)
      const session = await optimizedQueries.getSessionById(sessionId, userId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      const updatedSession = await optimizedQueries.updateSessionWithCache(
        sessionId,
        userId,
        { title }
      );

      return {
        ...updatedSession,
        _count: {
          messages: await optimizedQueries.getMessageCount(sessionId, userId),
        },
      };
    }),

  // Delete session
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .use(async opts => {
      // Apply rate limiting
      await sessionRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'deleteSession'
      );
      return opts.next();
    })
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = input;
      const userId = ctx.session.user.id;

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      // Verify the session belongs to the user (cached)
      const session = await optimizedQueries.getSessionById(sessionId, userId);
      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      // Delete the session with cache invalidation
      await optimizedQueries.deleteSessionWithCache(sessionId, userId);

      return { success: true };
    }),

  // Search sessions and messages
  searchSessions: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
        includeMessages: z.boolean().default(false),
      })
    )
    .use(async opts => {
      // Apply rate limiting for search
      await searchRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'searchSessions'
      );
      return opts.next();
    })
    .query(async ({ ctx, input }) => {
      const { query, limit, cursor, includeMessages } = input;
      const userId = ctx.session.user.id;

      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      return optimizedQueries.searchSessions(userId, query, {
        limit,
        cursor,
        includeMessages,
      });
    }),

  // Regenerate AI response for the last message
  regenerateResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        messageId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sessionId, messageId } = input;
      const userId = ctx.session.user.id;

      // Verify the session belongs to the user
      const session = await ctx.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Chat session not found',
        });
      }

      // Verify the message exists and is an AI message
      const messageToRegenerate = await ctx.prisma.message.findFirst({
        where: {
          id: messageId,
          sessionId,
          role: 'ASSISTANT',
        },
      });

      if (!messageToRegenerate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'AI message not found',
        });
      }

      try {
        // Get conversation history up to the message before the one being regenerated
        const conversationHistory = await ctx.prisma.message.findMany({
          where: {
            sessionId,
            createdAt: { lt: messageToRegenerate.createdAt },
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        });

        const aiMessages = conversationHistory.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        }));

        // Generate new AI response
        const newAiResponse = await AIService.generateResponse(aiMessages);

        // Update the existing AI message
        const updatedMessage = await ctx.prisma.message.update({
          where: { id: messageId },
          data: {
            content: newAiResponse,
            createdAt: new Date(), // Update timestamp to show it was regenerated
          },
        });

        return updatedMessage;
      } catch (error) {
        console.error('Error regenerating AI response:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to regenerate AI response. Please try again.',
        });
      }
    }),

  // Delete a specific message
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messageId, sessionId } = input;
      const userId = ctx.session.user.id;
      const messageService = new MessageService(ctx.prisma);

      await messageService.deleteMessage(messageId, sessionId, userId);
      return { success: true };
    }),

  // Search messages within a session
  searchMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { sessionId, query, limit } = input;
      const userId = ctx.session.user.id;
      const messageService = new MessageService(ctx.prisma);

      return await messageService.searchMessages(
        sessionId,
        userId,
        query,
        limit
      );
    }),

  // Get message count for a session
  getMessageCount: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { sessionId } = input;
      const userId = ctx.session.user.id;
      const messageService = new MessageService(ctx.prisma);

      return await messageService.getMessageCount(sessionId, userId);
    }),

  // Get session statistics
  getSessionStats: protectedProcedure
    .use(async opts => {
      // Apply rate limiting
      await sessionRateLimiter.checkLimit(
        opts.ctx.session.user.id,
        'getSessionStats'
      );
      return opts.next();
    })
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const optimizedQueries = new OptimizedQueries(ctx.prisma);

      return optimizedQueries.getSessionStats(userId);
    }),
});
