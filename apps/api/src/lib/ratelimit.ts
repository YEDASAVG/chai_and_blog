import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let _apiLimiter: Ratelimit | null = null;
let _uploadLimiter: Ratelimit | null = null;
let _blogCreateLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Rate limiter for API routes - 10 requests per 10 seconds
export const apiLimiter = {
  limit: async (identifier: string) => {
    if (!_apiLimiter) {
      _apiLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
        prefix: "ratelimit:api",
      });
    }
    return _apiLimiter.limit(identifier);
  },
};

// Stricter rate limiter for uploads - 5 uploads per minute
export const uploadLimiter = {
  limit: async (identifier: string) => {
    if (!_uploadLimiter) {
      _uploadLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "ratelimit:upload",
      });
    }
    return _uploadLimiter.limit(identifier);
  },
};

// Rate limiter for blog creation - 10 blogs per hour
export const blogCreateLimiter = {
  limit: async (identifier: string) => {
    if (!_blogCreateLimiter) {
      _blogCreateLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
        prefix: "ratelimit:blog-create",
      });
    }
    return _blogCreateLimiter.limit(identifier);
  },
};
