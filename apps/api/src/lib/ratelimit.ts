// In-memory sliding window rate limiter (no external dependencies)

interface RateLimitEntry {
  timestamps: number[];
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 60_000).unref();

  return {
    limit: async (identifier: string) => {
      const now = Date.now();
      let entry = store.get(identifier);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

      if (entry.timestamps.length >= maxRequests) {
        return { success: false, remaining: 0 };
      }

      entry.timestamps.push(now);
      return { success: true, remaining: maxRequests - entry.timestamps.length };
    },
  };
}

// Rate limiter for API routes - 10 requests per 10 seconds
export const apiLimiter = createRateLimiter(10, 10_000);

// Stricter rate limiter for uploads - 5 uploads per minute
export const uploadLimiter = createRateLimiter(5, 60_000);

// Rate limiter for blog creation - 10 blogs per hour
export const blogCreateLimiter = createRateLimiter(10, 3_600_000);
