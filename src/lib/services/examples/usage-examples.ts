/**
 * Usage examples for database services
 * These examples show how to use the database services in your application
 */

import {
  UserService,
  ChatSessionService,
  MessageService,
  DatabaseUtils,
  handleDatabaseError,
} from '../index';

/**
 * Example: Create a new user and their first chat session
 */
export async function createUserWithFirstSession(email: string, name?: string) {
  try {
    // Create user
    const user = await UserService.createUser({
      email,
      name,
    });

    // Create their first chat session
    const session = await ChatSessionService.createChatSession({
      userId: user.id,
      title: 'Welcome Chat',
    });

    // Add a welcome message
    await MessageService.createMessage(
      {
        content: 'Welcome to Career Counseling Chat! How can I help you today?',
        role: 'ASSISTANT',
        sessionId: session.id,
      },
      user.id
    );

    return { user, session };
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Handle a complete chat interaction
 */
export async function handleChatInteraction(
  userId: string,
  sessionId: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    // Create both messages in a transaction
    const messages = await MessageService.createMessagePair(
      userMessage,
      aiResponse,
      sessionId,
      userId
    );

    return messages;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Get user's chat history with pagination
 */
export async function getUserChatHistory(userId: string, cursor?: string) {
  try {
    const sessions = await ChatSessionService.getUserChatSessions(userId, {
      limit: 10,
      cursor,
    });

    // Get recent messages for each session
    const sessionsWithRecentMessages = await Promise.all(
      sessions.items.map(async session => {
        const recentMessages = await MessageService.getRecentMessages(
          session.id,
          userId,
          3
        );
        return {
          ...session,
          recentMessages: recentMessages.reverse(), // Show in chronological order
        };
      })
    );

    return {
      ...sessions,
      items: sessionsWithRecentMessages,
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Search across all user's messages
 */
export async function searchUserMessages(userId: string, query: string) {
  try {
    const results = await MessageService.searchMessages(userId, query, {
      limit: 20,
    });

    return results;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Get comprehensive user activity summary
 */
export async function getUserDashboard(userId: string) {
  try {
    const [userProfile, activitySummary, recentSessions] = await Promise.all([
      UserService.getUserWithStats(userId),
      DatabaseUtils.getUserActivitySummary(userId),
      ChatSessionService.getUserChatSessions(userId, { limit: 5 }),
    ]);

    return {
      profile: userProfile,
      activity: activitySummary,
      recentSessions: recentSessions.items,
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Update user preferences
 */
export async function updateUserSettings(
  userId: string,
  preferences: {
    theme?: 'LIGHT' | 'DARK';
    emailNotifications?: boolean;
  }
) {
  try {
    const updatedUser = await UserService.updateUserPreferences(
      userId,
      preferences
    );
    return updatedUser;
  } catch (error) {
    handleDatabaseError(error);
  }
}

/**
 * Example: Clean up old data (admin function)
 */
export async function performMaintenanceTasks() {
  try {
    const [healthCheck, stats, cleanupCount] = await Promise.all([
      DatabaseUtils.healthCheck(),
      DatabaseUtils.getStats(),
      DatabaseUtils.cleanupOldSessions(90), // Clean sessions older than 90 days
    ]);

    return {
      healthy: healthCheck,
      stats,
      cleanedSessions: cleanupCount,
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}
