import { Router, Request, Response, NextFunction } from "express";
import Blog from "../models/Blog.js";

const router = Router();

// Trusted domains for images
const TRUSTED_DOMAINS = [
  "ik.imagekit.io",
  "img.clerk.com",
  "images.clerk.dev",
  "avatars.githubusercontent.com",
  "lh3.googleusercontent.com",
];

/**
 * Extract the first image URL from TipTap JSON content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFirstImage(content: any): string | null {
  if (!content || !content.content) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function findImage(nodes: any[]): string | null {
    for (const node of nodes) {
      if (node.type === "image" && node.attrs?.src) {
        const src = node.attrs.src as string;
        // Validate URL and check trusted domains
        if (
          src.startsWith("https://") &&
          TRUSTED_DOMAINS.some((domain) => src.includes(domain))
        ) {
          return src;
        }
      }
      // Recursively search nested content
      if (node.content && Array.isArray(node.content)) {
        const found = findImage(node.content);
        if (found) return found;
      }
    }
    return null;
  }

  return findImage(content.content);
}

/**
 * GET /api/v1/feed - Get public feed of published blogs
 * 
 * Query params:
 * - cursor: Pagination cursor (blog _id)
 * - limit: Number of items (default: 10, max: 50)
 * - search: Search query for title/author
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit = "10", search } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { status: "published" };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Add search filter (escape regex special chars for security)
    if (search && typeof search === "string" && search.trim()) {
      const safeSearch = search
        .trim()
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { authorName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1, _id: -1 })
      .limit(limitNum + 1)
      .select("title slug description content authorName authorImage authorUsername tags coverImage publishedAt createdAt")
      .lean();

    const hasMore = blogs.length > limitNum;
    const items = hasMore ? blogs.slice(0, limitNum) : blogs;
    const nextCursor = hasMore ? items[items.length - 1]._id?.toString() : null;

    res.json({
      success: true,
      data: {
        blogs: items.map((blog) => {
          // Use stored coverImage or extract first image from content
          const coverImage = blog.coverImage || extractFirstImage(blog.content);
          return {
            id: blog._id.toString(),
            title: blog.title,
            slug: blog.slug,
            description: blog.description || "",
            authorName: blog.authorName || "Anonymous",
            authorImage: blog.authorImage,
            authorUsername: blog.authorUsername,
            tags: blog.tags || [],
            coverImage,
            publishedAt: blog.publishedAt || blog.createdAt,
          };
        }),
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/feed/:slug - Get a single published blog by slug
 */
router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: "published" }).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Blog not found" },
      });
    }

    // Use stored coverImage or extract first image from content
    const coverImage = blog.coverImage || extractFirstImage(blog.content);

    res.json({
      success: true,
      data: {
        blog: {
          id: blog._id.toString(),
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          description: blog.description || "",
          authorId: blog.authorId,
          authorName: blog.authorName || "Anonymous",
          authorImage: blog.authorImage,
          authorUsername: blog.authorUsername,
          tags: blog.tags || [],
          coverImage,
          publishedAt: blog.publishedAt || blog.createdAt,
          createdAt: blog.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
