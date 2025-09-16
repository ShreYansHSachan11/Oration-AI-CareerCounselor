// Edge Runtime compatible rate limiter (no tRPC dependencies)

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
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple IP-based rate limiter for Edge Runtime
class EdgeIPRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(ip: string): Promise<void> {
    const now = Date.now();
    const entry = this.store.get(ip);

    // Clean up expired entries on each check (since we can't use setInterval in Edge Runtime)
    this.cleanup();

    if (!entry || now > entry.resetTime) {
      this.store.set(ip, {
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
}

export const ipRateLimiter = new EdgeIPRateLimiter({
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