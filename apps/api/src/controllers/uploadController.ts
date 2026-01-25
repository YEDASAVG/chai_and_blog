import { Request, Response, NextFunction } from "express";
import { getImageKit, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "../lib/imagekit.js";
import { uploadLimiter } from "../lib/ratelimit.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

// POST /api/v1/upload - Upload image
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    // Rate limiting
    const { success, remaining } = await uploadLimiter.limit(userId);
    if (!success) {
      res.set("X-RateLimit-Remaining", remaining.toString());
      throw AppError.rateLimited("Too many uploads. Please wait a minute.");
    }

    const file = req.file;

    if (!file) {
      throw AppError.validation("No file provided");
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw AppError.validation(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw AppError.validation("File too large. Maximum size is 5MB.");
    }

    // Upload to ImageKit
    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: file.buffer,
      fileName: `${userId}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      folder: "/blog-images",
    });

    res.json({
      success: true,
      data: {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
      },
    });
  } catch (error) {
    next(error);
  }
}
