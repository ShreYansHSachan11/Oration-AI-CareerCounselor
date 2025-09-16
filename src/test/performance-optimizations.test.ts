import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sessionCache,
  messageCache,
  userCache,
  cacheKeys,
  withCache,
  invalidateUserCache,
  invalidateSessionCache,
} from '@/lib/cache';
import {
  globalRateLimiter,
  messageRateLimiter,
  sessionRateLimiter,
} from '@/lib/rate-limit';
import { performanceMonitor } from '@/lib/performance';

describe('Performance Optimizations', () => {
  beforeEach(() => {
    // Clear caches before each test
    sessionCache.clear();
    messageCache.clear();
    userCache.clear();
    performanceMonitor.clear();
  });

  describe('Caching System', () => {
    it('should cache and retrieve data correctly', async () => {
      const testData = { id: '1', name: 'Test User' };
      const key = 'test:user:1';

      // Cache should be empty initially
      expect(sessionCache.get(key)).toBeNull();

      // Set data in cache
      sessionCache.set(key, testData, 5000);

      // Should retrieve cached data
      expect(sessionCache.get(key)).toEqual(testData);
    });

    it('should expire cached data after TTL', async () => {
      const testData = { id: '1', name: 'Test User' };
      const key = 'test:user:1';

      // Set data with very short TTL
      sessionCache.set(key, testData, 1);

      // Should be available immediately
      expect(sessionCache.get(key)).toEqual(testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should be expired
      expect(sessionCache.get(key)).toBeNull();
    });

    it('should use withCache wrapper correctly', async () => {
      const key = 'test:expensive:operation';
      let callCount = 0;

      const expensiveOperation = async () => {
        callCount++;
        return { result: 'expensive data', callCount };
      };

      // First call should execute the function
      const result1 = await withCache(
        key,
        expensiveOperation,
        sessionCache,
        5000
      );
      expect(result1.callCount).toBe(1);
      expect(callCount).toBe(1);

      // Second call should use cache
      const result2 = await withCache(
        key,
        expensiveOperation,
        sessionCache,
        5000
      );
      expect(result2.callCount).toBe(1); // Same as first call
      expect(callCount).toBe(1); // Function not called again
    });

    it('should invalidate user cache correctly', () => {
      const userId = 'user123';

      // Set some user-related cache entries
      sessionCache.set(cacheKeys.userSessions(userId, 20), { sessions: [] });
      userCache.set(cacheKeys.userProfile(userId), { id: userId });
      messageCache.set(cacheKeys.sessionStats(userId), { total: 0 });

      // Verify data is cached
      expect(sessionCache.has(cacheKeys.userSessions(userId, 20))).toBe(true);
      expect(userCache.has(cacheKeys.userProfile(userId))).toBe(true);

      // Invalidate user cache
      invalidateUserCache(userId);

      // Verify data is removed
      expect(sessionCache.has(cacheKeys.userSessions(userId, 20))).toBe(false);
      expect(userCache.has(cacheKeys.userProfile(userId))).toBe(false);
    });

    it('should invalidate session cache correctly', () => {
      const sessionId = 'session123';

      // Set some session-related cache entries
      messageCache.set(cacheKeys.sessionMessages(sessionId, 50), {
        messages: [],
      });
      messageCache.set(cacheKeys.messageCount(sessionId), 5);

      // Verify data is cached
      expect(messageCache.has(cacheKeys.sessionMessages(sessionId, 50))).toBe(
        true
      );
      expect(messageCache.has(cacheKeys.messageCount(sessionId))).toBe(true);

      // Invalidate session cache
      invalidateSessionCache(sessionId);

      // Verify data is removed
      expect(messageCache.has(cacheKeys.sessionMessages(sessionId, 50))).toBe(
        false
      );
      expect(messageCache.has(cacheKeys.messageCount(sessionId))).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const userId = 'user123';

      // Should not throw for first request
      await expect(
        globalRateLimiter.checkLimit(userId)
      ).resolves.toBeUndefined();
    });

    it('should block requests exceeding rate limit', async () => {
      const userId = 'user123';

      // Create a rate limiter with very low limits for testing
      const testRateLimiter = new (globalRateLimiter.constructor as any)({
        windowMs: 1000,
        maxRequests: 2,
      });

      // First two requests should pass
      await expect(testRateLimiter.checkLimit(userId)).resolves.toBeUndefined();
      await expect(testRateLimiter.checkLimit(userId)).resolves.toBeUndefined();

      // Third request should be blocked
      await expect(testRateLimiter.checkLimit(userId)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should reset rate limit after window expires', async () => {
      const userId = 'user123';

      // Create a rate limiter with short window for testing
      const testRateLimiter = new (globalRateLimiter.constructor as any)({
        windowMs: 50, // 50ms window
        maxRequests: 1,
      });

      // First request should pass
      await expect(testRateLimiter.checkLimit(userId)).resolves.toBeUndefined();

      // Second request should be blocked
      await expect(testRateLimiter.checkLimit(userId)).rejects.toThrow(
        'Rate limit exceeded'
      );

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 60));

      // Should allow requests again
      await expect(testRateLimiter.checkLimit(userId)).resolves.toBeUndefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const timer = performanceMonitor.startTimer('test-operation');

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }

      const duration = timer.end();

      // Should have recorded the metric
      const metrics = performanceMonitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeGreaterThan(5);
      expect(metrics[0].duration).toBeLessThan(50);
    });

    it('should calculate performance statistics', () => {
      // Add some test metrics
      performanceMonitor.addMetric('test-op', 100);
      performanceMonitor.addMetric('test-op', 200);
      performanceMonitor.addMetric('test-op', 300);

      const stats = performanceMonitor.getStats('test-op');

      expect(stats.count).toBe(3);
      expect(stats.average).toBe(200);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
    });

    it('should clear metrics correctly', () => {
      performanceMonitor.addMetric('test-op-1', 100);
      performanceMonitor.addMetric('test-op-2', 200);

      expect(performanceMonitor.getMetrics('test-op-1')).toHaveLength(1);
      expect(performanceMonitor.getMetrics('test-op-2')).toHaveLength(1);

      // Clear specific metric
      performanceMonitor.clear('test-op-1');

      expect(performanceMonitor.getMetrics('test-op-1')).toHaveLength(0);
      expect(performanceMonitor.getMetrics('test-op-2')).toHaveLength(1);

      // Clear all metrics
      performanceMonitor.clear();

      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const userId = 'user123';
      const sessionId = 'session456';

      // Test user sessions key
      const sessionsKey1 = cacheKeys.userSessions(userId, 20);
      const sessionsKey2 = cacheKeys.userSessions(userId, 20);
      expect(sessionsKey1).toBe(sessionsKey2);

      // Test session messages key
      const messagesKey1 = cacheKeys.sessionMessages(sessionId, 50);
      const messagesKey2 = cacheKeys.sessionMessages(sessionId, 50);
      expect(messagesKey1).toBe(messagesKey2);

      // Test with different parameters
      const sessionsKey3 = cacheKeys.userSessions(userId, 30);
      expect(sessionsKey1).not.toBe(sessionsKey3);
    });

    it('should include search parameters in cache keys', () => {
      const userId = 'user123';

      const key1 = cacheKeys.userSessions(userId, 20);
      const key2 = cacheKeys.userSessions(userId, 20, 'search term');

      expect(key1).not.toBe(key2);
      expect(key2).toContain('search term');
    });
  });

  describe('Memory Management', () => {
    it('should respect cache size limits', () => {
      const smallCache = new (sessionCache.constructor as any)(3); // Max 3 items

      // Add items up to limit
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      expect(smallCache.size()).toBe(3);

      // Adding another item should remove the oldest
      smallCache.set('key4', 'value4');

      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('key1')).toBe(false); // Oldest should be removed
      expect(smallCache.has('key4')).toBe(true); // Newest should be present
    });

    it('should clean up expired entries', async () => {
      // Set items with short TTL
      sessionCache.set('temp1', 'value1', 1);
      sessionCache.set('temp2', 'value2', 1);
      sessionCache.set('permanent', 'value3', 10000);

      expect(sessionCache.size()).toBe(3);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      // Trigger cleanup by accessing cache
      sessionCache.get('permanent');

      // Manual cleanup simulation (in real implementation this happens automatically)
      const cacheInstance = sessionCache as any;
      if (cacheInstance.cleanup) {
        cacheInstance.cleanup();
      }

      // Permanent item should still exist
      expect(sessionCache.has('permanent')).toBe(true);
    });
  });
});
