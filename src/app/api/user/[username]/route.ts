import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Blog from "@/models/Blog";

// GET public user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    await dbConnect();

    const user = await User.findOne({ username }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    return NextResponse.json({
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      twitter: user.twitter || "",
      joinedAt: user.createdAt,
      blogs: blogsWithReadingTime,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
