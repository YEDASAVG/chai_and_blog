import { Request, Response, NextFunction } from "express";
import { apiLimiter, uploadLimiter, blogCreateLimiter } from "../lib/ratelimit.js";
import { ErrorCodes } from "@lingo/shared";
import type { AuthenticatedRequest } from "./auth.js";

type Limiter = { limit: (id: string) => Promise<{ success: boolean; remaining: number }> };

/**
 * Create rate limiting middleware
 */
function createRateLimiter(limiter: Limiter) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      const identifier =
        userId || req.ip || req.socket.remoteAddress || "unknown";

      const { success, remaining } = await limiter.limit(identifier);

      if (!success) {
        res
          .status(429)
          .set("X-RateLimit-Remaining", remaining.toString())
          .json({
            success: false,
            error: {
              code: ErrorCodes.RATE_LIMITED,
              message: "Too many requests. Please slow down.",
            },
          });
        return;
      }

      next();
    } catch (error) {
      // If rate limiter fails (e.g. Redis unreachable), allow the request through
      console.error("Rate limiter error:", error);
      next();
    }
  };
}

export const rateLimit = createRateLimiter(apiLimiter);
export const uploadRateLimit = createRateLimiter(uploadLimiter);
export const blogCreateRateLimit = createRateLimiter(blogCreateLimiter);
