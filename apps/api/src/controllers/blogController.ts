import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import Blog from "../models/Blog.js";
import { blogCreateLimiter } from "../lib/ratelimit.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

// GET /api/v1/blogs - Get user's blogs
export async function getBlogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const status = req.query.status as string | undefined;

    const query: { authorId: string; status?: string } = { authorId: userId };
    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .sort({ updatedAt: -1 })
      .select("title slug status createdAt updatedAt publishedAt")
      .lean();

    res.json({ success: true, data: { blogs } });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/blogs - Create or update a blog
export async function createOrUpdateBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    // Get user info from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const authorName = clerkUser?.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
      : clerkUser?.username || "Anonymous";
    const authorImage = clerkUser?.imageUrl || undefined;

    const { id, title, content, status, description, tags } = req.body;

    // Validation
    if (title && title.length > 200) {
      throw AppError.validation("Title too long. Maximum 200 characters.");
    }

    if (description && description.length > 300) {
      throw AppError.validation(
        "Description too long. Maximum 300 characters."
      );
    }

    if (tags && (tags.length > 5 || tags.some((t: string) => t.length > 30))) {
      throw AppError.validation(
        "Maximum 5 tags allowed, each up to 30 characters."
      );
    }

    const contentSize = JSON.stringify(content || {}).length;
    if (contentSize > 500000) {
      throw AppError.validation(
        "Content too large. Please reduce the blog size."
      );
    }

    // Update existing blog
    if (id) {
      const blog = await Blog.findOne({ _id: id, authorId: userId });
      if (!blog) {
        throw AppError.notFound("Blog not found");
      }

      blog.title = title || blog.title;
      blog.content = content || blog.content;
      blog.authorName = authorName;
      blog.authorImage = authorImage;
      if (description !== undefined) blog.description = description;
      if (tags !== undefined) blog.tags = tags;

      // If publishing for the first time
      if (status === "published" && blog.status !== "published") {
        blog.status = "published";
        blog.publishedAt = new Date();
        if (!blog.slug || blog.slug.startsWith("draft-")) {
          blog.slug = generateSlug(title || blog.title);
        }
      } else if (status === "published") {
        // Already published, keep it published
        blog.status = "published";
      } else if (status === "draft" && blog.status === "published") {
        // Prevent accidentally reverting published blog to draft
        // This protects against race conditions with auto-save
        console.log(`[Blog] Ignoring draft save for published blog ${blog._id}`);
        // Don't change status, just save content updates
      } else if (status) {
        blog.status = status;
      }

      await blog.save();

      res.json({
        success: true,
        data: {
          blog: {
            id: blog._id,
            title: blog.title,
            slug: blog.slug,
            status: blog.status,
          },
        },
      });
      return;
    }

    // Rate limit new blog creation
    const { success: canCreate } = await blogCreateLimiter.limit(userId);
    if (!canCreate) {
      throw AppError.rateLimited(
        "You've created too many blogs recently. Please wait before creating more."
      );
    }

    // Create new blog
    const slug =
      status === "published" ? generateSlug(title) : `draft-${Date.now()}`;

    const blog = await Blog.create({
      authorId: userId,
      authorName,
      authorImage,
      title: title || "Untitled",
      slug,
      content: content || { type: "doc", content: [] },
      description: description || "",
      tags: tags || [],
      status: status || "draft",
      ...(status === "published" && { publishedAt: new Date() }),
    });

    res.status(201).json({
      success: true,
      data: {
        blog: {
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          status: blog.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/blogs/:id - Get a single blog for editing
export async function getBlogById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { id } = req.params;

    const blog = await Blog.findById(id).lean();

    if (!blog) {
      throw AppError.notFound("Blog not found");
    }

    // Only the author can access this endpoint
    if (blog.authorId !== userId) {
      throw AppError.forbidden("Not authorized to access this blog");
    }

    res.json({ success: true, data: { blog } });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/blogs/:id - Delete a blog
export async function deleteBlog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { id } = req.params;

    const blog = await Blog.findOneAndDelete({ _id: id, authorId: userId });

    if (!blog) {
      throw AppError.notFound("Blog not found");
    }

    res.json({ success: true, data: { message: "Blog deleted successfully" } });
  } catch (error) {
    next(error);
  }
}
