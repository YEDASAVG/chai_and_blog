import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import { AppError } from "../middleware/errorHandler.js";

// GET /api/v1/users/:username - Get public user profile
export async function getUserByUsername(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).lean();

    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Get user's published blogs
    const blogs = await Blog.find({
      authorId: user.clerkId,
      status: "published",
    })
      .sort({ createdAt: -1 })
      .select("title slug createdAt content")
      .lean();

    // Calculate reading time for each blog
    const blogsWithReadingTime = blogs.map((blog) => {
      const text = JSON.stringify(blog.content || "");
      const words = text.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(words / 200));
      return {
        title: blog.title,
        slug: blog.slug,
        createdAt: blog.createdAt,
        readingTime,
      };
    });

    res.json({
      success: true,
      data: {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio || "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
        joinedAt: user.createdAt,
        blogs: blogsWithReadingTime,
      },
    });
  } catch (error) {
    next(error);
  }
}
