import { Request, Response, NextFunction } from "express";
import { ErrorCodes } from "@lingo/shared";

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error safely - never expose sensitive data
  const isDev = process.env.NODE_ENV !== "production";
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (isDev) {
    console.error("Stack:", err.stack);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || ErrorCodes.INTERNAL_ERROR;
  const message = err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

// Custom error class for API errors
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, ErrorCodes.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, ErrorCodes.FORBIDDEN);
  }

  static notFound(message = "Not found") {
    return new AppError(message, 404, ErrorCodes.NOT_FOUND);
  }

  static validation(message: string) {
    return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR);
  }

  static rateLimited(message = "Too many requests") {
    return new AppError(message, 429, ErrorCodes.RATE_LIMITED);
  }
}
