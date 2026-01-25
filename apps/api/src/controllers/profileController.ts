import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

// GET /api/v1/profile - Get current user's profile
export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    let user = await User.findOne({ clerkId: userId }).lean();

    // If user doesn't exist in MongoDB, create from Clerk data using upsert to prevent race conditions
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      if (!clerkUser) {
        throw AppError.notFound("User not found");
      }

      // Use findOneAndUpdate with upsert to atomically create or get the user
      // This prevents duplicate user creation if two requests come simultaneously
      const createdUser = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $setOnInsert: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: clerkUser.firstName || clerkUser.username || "User",
            username: clerkUser.username || clerkUser.id.slice(0, 12),
            avatar: clerkUser.imageUrl,
          },
        },
        { upsert: true, new: true }
      ).lean();

      // Safety check - should never happen with upsert + new: true, but satisfies TypeScript
      if (!createdUser) {
        throw AppError.notFound("Failed to create user profile");
      }
      user = createdUser;
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/profile - Update user's profile
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, bio, github, linkedin, twitter } = req.body;

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (github !== undefined) updateFields.github = github;
    if (linkedin !== undefined) updateFields.linkedin = linkedin;
    if (twitter !== undefined) updateFields.twitter = twitter;

    // Try to update existing user first
    let user = await User.findOneAndUpdate(
      { clerkId: userId },
      { $set: updateFields },
      { new: true }
    );

    // If user doesn't exist, create from Clerk data with upsert
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      if (!clerkUser) {
        throw AppError.notFound("User not found");
      }

      // Build the complete user data for new user
      const newUserData = {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: name || clerkUser.firstName || clerkUser.username || "User",
        username: clerkUser.username || clerkUser.id.slice(0, 12),
        avatar: clerkUser.imageUrl,
        bio: bio || "",
        github: github || "",
        linkedin: linkedin || "",
        twitter: twitter || "",
      };

      // Use findOneAndUpdate with upsert to atomically create the user
      const createdUser = await User.findOneAndUpdate(
        { clerkId: userId },
        { $setOnInsert: newUserData },
        { upsert: true, new: true }
      );

      // Safety check - should never happen with upsert + new: true, but satisfies TypeScript
      if (!createdUser) {
        throw AppError.notFound("Failed to create user profile");
      }
      user = createdUser;
    }

    res.json({
      success: true,
      data: {
        message: "Profile updated successfully",
        user: {
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio || "",
          github: user.github || "",
          linkedin: user.linkedin || "",
          twitter: user.twitter || "",
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
