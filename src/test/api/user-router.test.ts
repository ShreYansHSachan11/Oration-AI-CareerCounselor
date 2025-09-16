import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userRouter } from '@/server/api/routers/user';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('User Router', () => {
  const mockSession: Session = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    theme: 'LIGHT' as const,
    emailNotifications: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  };

  const createTestContext = () => ({
    session: mockSession,
    prisma,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockFindUnique = vi.mocked(prisma.user.findUnique);
      mockFindUnique.mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.getProfile();

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockFindUnique = vi.mocked(prisma.user.findUnique);
      mockFindUnique.mockResolvedValue(null);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.getProfile();

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockFindUnique = vi.mocked(prisma.user.findUnique);
      mockFindUnique.mockRejectedValue(new Error('Database connection failed'));

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      await expect(caller.getProfile()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update theme preference', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      const updatedUser = { ...mockUser, theme: 'DARK' as const };
      mockUpdate.mockResolvedValue(updatedUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.updatePreferences({
        theme: 'DARK',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          theme: 'DARK',
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result.theme).toBe('DARK');
    });

    it('should update email notifications preference', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      const updatedUser = { ...mockUser, emailNotifications: false };
      mockUpdate.mockResolvedValue(updatedUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.updatePreferences({
        emailNotifications: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          emailNotifications: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result.emailNotifications).toBe(false);
    });

    it('should update both theme and email notifications', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      const updatedUser = {
        ...mockUser,
        theme: 'DARK' as const,
        emailNotifications: false,
      };
      mockUpdate.mockResolvedValue(updatedUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.updatePreferences({
        theme: 'DARK',
        emailNotifications: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          theme: 'DARK',
          emailNotifications: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result.theme).toBe('DARK');
      expect(result.emailNotifications).toBe(false);
    });

    it('should handle empty preferences update', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      mockUpdate.mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      const result = await caller.updatePreferences({});

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {},
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          theme: true,
          emailNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should validate theme enum values', async () => {
      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      await expect(
        caller.updatePreferences({
          theme: 'INVALID' as any,
        })
      ).rejects.toThrow();
    });

    it('should validate boolean values for email notifications', async () => {
      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      await expect(
        caller.updatePreferences({
          emailNotifications: 'invalid' as any,
        })
      ).rejects.toThrow();
    });

    it('should handle user not found error', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      const notFoundError = new Error('Record not found');
      notFoundError.name = 'PrismaClientKnownRequestError';
      mockUpdate.mockRejectedValue(notFoundError);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      await expect(
        caller.updatePreferences({
          theme: 'DARK',
        })
      ).rejects.toThrow('Record not found');
    });

    it('should handle database connection errors', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      mockUpdate.mockRejectedValue(new Error('Database connection failed'));

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      await expect(
        caller.updatePreferences({
          theme: 'DARK',
        })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('authentication', () => {
    it('should require authentication for getProfile', async () => {
      const ctx = {
        session: null,
        prisma,
      };

      const caller = userRouter.createCaller(ctx);

      await expect(caller.getProfile()).rejects.toThrow('UNAUTHORIZED');
    });

    it('should require authentication for updatePreferences', async () => {
      const ctx = {
        session: null,
        prisma,
      };

      const caller = userRouter.createCaller(ctx);

      await expect(
        caller.updatePreferences({
          theme: 'DARK',
        })
      ).rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('input validation', () => {
    it('should accept valid theme values', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      mockUpdate.mockResolvedValue({ ...mockUser, theme: 'LIGHT' });

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      // Should not throw for valid theme values
      await expect(
        caller.updatePreferences({ theme: 'LIGHT' })
      ).resolves.toBeDefined();

      await expect(
        caller.updatePreferences({ theme: 'DARK' })
      ).resolves.toBeDefined();
    });

    it('should accept valid boolean values for emailNotifications', async () => {
      const mockUpdate = vi.mocked(prisma.user.update);
      mockUpdate.mockResolvedValue(mockUser);

      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      // Should not throw for valid boolean values
      await expect(
        caller.updatePreferences({ emailNotifications: true })
      ).resolves.toBeDefined();

      await expect(
        caller.updatePreferences({ emailNotifications: false })
      ).resolves.toBeDefined();
    });

    it('should reject invalid input types', async () => {
      const ctx = createTestContext();
      const caller = userRouter.createCaller(ctx);

      // Should throw for invalid types
      await expect(
        caller.updatePreferences({
          theme: 123 as any,
        })
      ).rejects.toThrow();

      await expect(
        caller.updatePreferences({
          emailNotifications: 'yes' as any,
        })
      ).rejects.toThrow();
    });
  });
});
