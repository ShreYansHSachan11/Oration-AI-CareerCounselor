import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/api/root';
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc';

describe('tRPC Setup', () => {
  it('should have app router defined', () => {
    expect(appRouter).toBeDefined();
    expect(typeof appRouter).toBe('object');
  });

  it('should have tRPC router and procedure creators available', () => {
    expect(createTRPCRouter).toBeDefined();
    expect(protectedProcedure).toBeDefined();
    expect(publicProcedure).toBeDefined();
  });

  it('should be able to create a simple router', () => {
    const testRouter = createTRPCRouter({
      test: publicProcedure.query(() => 'test'),
    });

    expect(testRouter).toBeDefined();
  });
});
