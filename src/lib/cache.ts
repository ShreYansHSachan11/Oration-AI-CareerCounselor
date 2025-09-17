interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Create cache instances for different data types
export const sessionCache = new MemoryCache(500); // Cache for session data
export const messageCache = new MemoryCache(1000); // Cache for message data
export const userCache = new MemoryCache(200); // Cache for user data
export const searchCache = new MemoryCache(300); // Cache for search results

// Cache key generators
export const cacheKeys = {
  userSessions: (userId: string, limit: number, search?: string, includeArchived?: boolean, includeLatestMessage?: boolean) =>
    `user:${userId}:sessions:${limit}:${search || 'all'}:${includeArchived ? 'archived' : 'active'}:${includeLatestMessage ? 'with-preview' : 'no-preview'}`,

  sessionMessages: (sessionId: string, limit: number, cursor?: string) =>
    `session:${sessionId}:messages:${limit}:${cursor || 'start'}`,

  userProfile: (userId: string) => `user:${userId}:profile`,

  sessionStats: (userId: string) => `user:${userId}:stats`,

  searchResults: (userId: string, query: string, limit: number) =>
    `search:${userId}:${query}:${limit}`,

  messageCount: (sessionId: string) => `session:${sessionId}:count`,
};

// Cache wrapper functions
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: MemoryCache = sessionCache,
  ttlMs = 5 * 60 * 1000
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch data and cache it
  const data = await fetcher();
  cache.set(key, data, ttlMs);

  return data;
}

// Invalidate related cache entries
export function invalidateUserCache(userId: string): void {
  const keysToDelete: string[] = [];

  // Find all keys related to this user
  for (const cache of [sessionCache, messageCache, userCache, searchCache]) {
    const cacheInstance = cache as any;
    for (const key of cacheInstance.cache.keys()) {
      if (key.includes(`user:${userId}`) || key.includes(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
  }

  // Delete the keys
  keysToDelete.forEach(key => {
    sessionCache.delete(key);
    messageCache.delete(key);
    userCache.delete(key);
    searchCache.delete(key);
  });
}

export function invalidateSessionCache(sessionId: string): void {
  const keysToDelete: string[] = [];

  // Find all keys related to this session
  for (const cache of [sessionCache, messageCache, searchCache]) {
    const cacheInstance = cache as any;
    for (const key of cacheInstance.cache.keys()) {
      if (key.includes(`session:${sessionId}`)) {
        keysToDelete.push(key);
      }
    }
  }

  // Delete the keys
  keysToDelete.forEach(key => {
    sessionCache.delete(key);
    messageCache.delete(key);
    searchCache.delete(key);
  });
}

// Cache middleware for tRPC
export function createCacheMiddleware<T>(
  keyGenerator: (...args: any[]) => string,
  cache: MemoryCache = sessionCache,
  ttlMs = 5 * 60 * 1000
) {
  return async (opts: {
    input: any;
    ctx: any;
    next: () => Promise<{ data: T }>;
  }) => {
    const cacheKey = keyGenerator(opts.input, opts.ctx);

    // Try cache first
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return { data: cached };
    }

    // Execute the procedure
    const result = await opts.next();

    // Cache the result
    cache.set(cacheKey, result.data, ttlMs);

    return result;
  };
}

// Response caching for API routes
export function createResponseCache(ttlSeconds = 300) {
  return {
    'Cache-Control': `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
  };
}

// Cache warming functions
export async function warmUserCache(
  userId: string,
  prisma: any
): Promise<void> {
  try {
    // Pre-load user's recent sessions
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    const cacheKey = cacheKeys.userSessions(userId, 20);
    sessionCache.set(
      cacheKey,
      { items: sessions, hasMore: false },
      10 * 60 * 1000
    );

    // Pre-load user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        theme: true,
        emailNotifications: true,
      },
    });

    if (user) {
      userCache.set(cacheKeys.userProfile(userId), user, 15 * 60 * 1000);
    }
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

export async function warmSessionCache(
  sessionId: string,
  prisma: any
): Promise<void> {
  try {
    // Pre-load recent messages
    const messages = await prisma.message.findMany({
      where: { sessionId },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    const cacheKey = cacheKeys.sessionMessages(sessionId, 50);
    messageCache.set(
      cacheKey,
      { items: messages, hasMore: false },
      5 * 60 * 1000
    );

    // Pre-load message count
    const count = await prisma.message.count({
      where: { sessionId },
    });

    messageCache.set(cacheKeys.messageCount(sessionId), count, 10 * 60 * 1000);
  } catch (error) {
    console.error('Session cache warming failed:', error);
  }
}
