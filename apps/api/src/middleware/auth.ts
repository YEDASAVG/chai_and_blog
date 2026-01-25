import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { ErrorCodes } from "@lingo/shared";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Middleware to require authentication
 * Extracts userId from Clerk and attaches to request
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: "You must be logged in to access this resource",
      },
    });
    return;
  }

  // Attach userId to request for use in controllers
  (req as AuthenticatedRequest).userId = auth.userId;
  next();
}
