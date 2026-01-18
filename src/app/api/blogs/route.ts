import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

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
    const { id, title, content, status } = body;

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
