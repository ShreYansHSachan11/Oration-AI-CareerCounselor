import { TRPCError } from '@trpc/server';

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

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (userId: string, endpoint?: string) =>
        endpoint ? `${userId}:${endpoint}` : userId,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
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
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
      });
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

// Rate limiting middleware for tRPC
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  endpoint?: string
) {
  return async (opts: { ctx: { session?: { user?: { id: string } } } }) => {
    const userId = opts.ctx.session?.user?.id;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    await rateLimiter.checkLimit(userId, endpoint);

    return opts;
  };
}

// IP-based rate limiting for public endpoints
class IPRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async checkLimit(ip: string): Promise<void> {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return;
    }

    if (entry.count >= this.config.maxRequests) {
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
      });
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
}

export const ipRateLimiter = new IPRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes per IP
});

// Helper to get client IP
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
