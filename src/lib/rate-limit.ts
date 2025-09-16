// Custom error class for rate limiting
export class RateLimitError extends Error {
  public readonly code: string;
  public readonly resetTime: number;

  constructor(message: string, resetTime: number) {
    super(message);
    this.name = 'RateLimitError';
    this.code = 'TOO_MANY_REQUESTS';
    this.resetTime = resetTime;
  }
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (userId: string, endpoint?: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (userId: string, endpoint?: string) =>
        endpoint ? `${userId}:${endpoint}` : userId,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Only set up cleanup interval if not in Edge Runtime
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  async checkLimit(userId: string, endpoint?: string): Promise<void> {
    const key = this.config.keyGenerator(userId, endpoint);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return;
    }

    if (entry.count >= this.config.maxRequests) {
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
        entry.resetTime
      );
    }

    entry.count++;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  getStats(
    userId: string,
    endpoint?: string
  ): { count: number; resetTime: number } | null {
    const key = this.config.keyGenerator(userId, endpoint);
    return this.store.get(key) || null;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Create rate limiters for different endpoints
export const globalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes per user
});

export const messageRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 messages per minute per user
});

export const sessionRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 session operations per minute per user
});

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 searches per minute per user
});

// Simple rate limit check function (no tRPC dependency)
export async function checkRateLimit(
  rateLimiter: RateLimiter,
  userId: string,
  endpoint?: string
): Promise<void> {
  await rateLimiter.checkLimit(userId, endpoint);
}

// Export the rate limiters for server-side use
export { globalRateLimiter, messageRateLimiter, sessionRateLimiter, searchRateLimiter };
