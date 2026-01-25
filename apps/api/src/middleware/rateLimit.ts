import { Request, Response, NextFunction } from "express";
import { apiLimiter, uploadLimiter, blogCreateLimiter } from "../lib/ratelimit.js";
import { ErrorCodes } from "@lingo/shared";
import type { AuthenticatedRequest } from "./auth.js";

/**
 * Create rate limiting middleware
 */
function createRateLimiter(
  limiter: typeof apiLimiter | typeof uploadLimiter | typeof blogCreateLimiter
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = (req as AuthenticatedRequest).userId;

    if (!userId) {
      // If no userId, rate limit by IP
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const { success, remaining } = await limiter.limit(ip);

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
      return;
    }

    const { success, remaining } = await limiter.limit(userId);

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
  };
}

export const rateLimit = createRateLimiter(apiLimiter);
export const uploadRateLimit = createRateLimiter(uploadLimiter);
export const blogCreateRateLimit = createRateLimiter(blogCreateLimiter);
