import { db } from '../db';
import type { User, Theme } from '@prisma/client';

export interface CreateUserData {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

export interface UpdateUserPreferences {
  theme?: Theme;
  emailNotifications?: boolean;
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(data: CreateUserData): Promise<User> {
    return db.user.create({
      data,
    });
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id },
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: UpdateUserPreferences
  ): Promise<User> {
    return db.user.update({
      where: { id: userId },
      data: preferences,
    });
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    data: { name?: string; image?: string }
  ): Promise<User> {
    return db.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Delete user and all associated data
   */
  static async deleteUser(userId: string): Promise<void> {
    await db.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get user with chat sessions count
   */
  static async getUserWithStats(userId: string) {
    return db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            chatSessions: true,
          },
        },
      },
    });
  }
}
