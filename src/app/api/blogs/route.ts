import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import { apiLimiter, blogCreateLimiter } from "@/lib/ratelimit";

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

// GET /api/blogs - Get user's blogs
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 10 requests per 10 seconds
    const { success } = await apiLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'draft' | 'published' | null (all)

    const query: { authorId: string; status?: string } = { authorId: userId };
    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .sort({ updatedAt: -1 })
      .select("title slug status createdAt updatedAt publishedAt")
      .lean();

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST /api/blogs - Create or update a blog
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const authorName = user?.firstName 
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user?.username || "Anonymous";
    const authorImage = user?.imageUrl || undefined;

    await dbConnect();

    const body = await request.json();
    const { id, title, content, status, description, tags } = body;

    // Security: Validate title length
    if (title && title.length > 200) {
      return NextResponse.json({ error: "Title too long. Maximum 200 characters." }, { status: 400 });
    }

    // Security: Validate description length
    if (description && description.length > 300) {
      return NextResponse.json({ error: "Description too long. Maximum 300 characters." }, { status: 400 });
    }

    // Security: Validate tags
    if (tags && (tags.length > 5 || tags.some((t: string) => t.length > 30))) {
      return NextResponse.json({ error: "Maximum 5 tags allowed, each up to 30 characters." }, { status: 400 });
    }

    // Security: Validate content size (roughly 500KB limit)
    const contentSize = JSON.stringify(content || {}).length;
    if (contentSize > 500000) {
      return NextResponse.json({ error: "Content too large. Please reduce the blog size." }, { status: 400 });
    }

    // Update existing blog
    if (id) {
      const blog = await Blog.findOne({ _id: id, authorId: userId });
      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
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
        // Generate slug on publish if not exists
        if (!blog.slug || blog.slug.startsWith("draft-")) {
          blog.slug = generateSlug(title || blog.title);
        }
      } else if (status) {
        blog.status = status;
      }

      await blog.save();

      return NextResponse.json({
        blog: {
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          status: blog.status,
        },
      });
    }

    // Rate limit new blog creation (10 per hour)
    const { success: canCreate } = await blogCreateLimiter.limit(userId);
    if (!canCreate) {
      return NextResponse.json(
        { error: "You've created too many blogs recently. Please wait before creating more." },
        { status: 429 }
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

    return NextResponse.json(
      {
        blog: {
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          status: blog.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save blog:", error);
    return NextResponse.json({ error: "Failed to save blog" }, { status: 500 });
  }
}
