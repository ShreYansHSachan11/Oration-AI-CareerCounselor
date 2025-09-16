import { describe, it, expect, vi } from 'vitest';
import { appRouter } from '../root';

// Mock getServerSession to avoid Next.js context issues in tests
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

describe('tRPC Infrastructure', () => {
  it('should have chat router defined', () => {
    expect(appRouter.chat).toBeDefined();
  });

  it('should have user router defined', () => {
    expect(appRouter.user).toBeDefined();
  });

  it('should have protected procedures', () => {
    // Test that protected procedures exist
    expect(appRouter.chat.getSessions).toBeDefined();
    expect(appRouter.chat.createSession).toBeDefined();
    expect(appRouter.chat.getMessages).toBeDefined();
    expect(appRouter.chat.sendMessage).toBeDefined();
    expect(appRouter.chat.updateSession).toBeDefined();
    expect(appRouter.chat.deleteSession).toBeDefined();
    expect(appRouter.user.getProfile).toBeDefined();
    expect(appRouter.user.updatePreferences).toBeDefined();
  });

  it('should export AppRouter type', () => {
    // This test ensures the router is properly typed
    expect(typeof appRouter).toBe('object');
    expect(appRouter.chat).toBeDefined();
    expect(appRouter.user).toBeDefined();
  });
});
