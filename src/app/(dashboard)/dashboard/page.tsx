import Link from "next/link";
import Image from "next/image";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import CopyLinkButton from "@/components/CopyLinkButton";

// Fetch featured blogs - user's 2 latest + 1 from community
async function getFeaturedBlogs(currentUserId: string) {
  // Get user's latest 2 published blogs
  const userBlogs = await Blog.find({ 
    status: "published",
    authorId: currentUserId
  })
    .sort({ publishedAt: -1 })
    .limit(2)
    .select("title slug authorName authorImage publishedAt content")
    .lean();

  // Get 1 community blog (or more if user has fewer than 2)
  const communityLimit = 3 - userBlogs.length;
  const communityBlogs = communityLimit > 0 ? await Blog.find({ 
    status: "published",
    authorId: { $ne: currentUserId }
  })
    .sort({ publishedAt: -1 })
    .limit(communityLimit)
    .select("title slug authorName authorImage publishedAt content")
    .lean() : [];

  // User's blogs first, then community
  return [...userBlogs, ...communityBlogs];
}

// Extract preview text from Tiptap content
function getPreviewText(content: { content?: Array<{ type: string; content?: Array<{ text?: string }> }> }): string {
  if (!content || !content.content) return "";
  let text = "";
  for (const node of content.content) {
    if (node.type === "paragraph" && node.content) {
      for (const child of node.content) {
        if (child.text) text += child.text + " ";
      }
    }
    if (text.length > 100) break;
  }
  return text.trim().slice(0, 100) || "Read more...";
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  // Connect to DB and fetch user's blogs + featured blogs
  await dbConnect();
  const [blogs, featuredBlogs] = await Promise.all([
    Blog.find({ authorId: userId }).sort({ updatedAt: -1 }).lean(),
    getFeaturedBlogs(userId),
  ]);

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || "Writer"} 👋
        </h1>
        <p className="text-gray-400">
          Ready to share your knowledge with the community?
        </p>
      </div>

      {/* Featured Blogs Section */}
      {featuredBlogs.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Blogs</h2>
            <Link href="/feed" className="text-sm text-[#f97316] hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredBlogs.map((blog, index) => (
              <Link
                key={blog._id?.toString()}
                href={`/blog/${blog.slug}`}
                className="group relative bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden hover:border-[#f97316]/50 transition-all hover:shadow-lg hover:shadow-[#f97316]/5"
              >
                {/* Content preview area */}
                <div className="p-5 pb-16">
                  <h3 
                    className="font-semibold text-lg group-hover:text-[#f97316] transition-colors line-clamp-2 mb-2" 
                    style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
                  >
                    {blog.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {getPreviewText(blog.content)}
                  </p>
                </div>
                
                {/* Author footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent">
                  <div className="flex items-center gap-2">
                    {blog.authorImage ? (
                      <Image
                        src={blog.authorImage}
                        alt={blog.authorName || "Author"}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-xs font-bold">
                        {blog.authorName?.[0]?.toUpperCase() || "A"}
                      </div>
                    )}
                    <span className="text-sm text-gray-400">{blog.authorName || "Anonymous"}</span>
                    {index < 2 && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-[#f97316]/20 text-[#f97316] rounded-full">
                        Your blog
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Blogs Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Blogs</h2>
      </div>

      {blogs.length === 0 ? (
        <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              data-lingo-skip
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No blogs yet</h3>
          <p className="text-gray-400 mb-6">
            Start writing your first blog and share it with the cohort!
          </p>
          <Link
            href="/write"
            className="inline-block bg-[#f97316] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#ea580c] transition-colors"
          >
            Write Your First Blog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map((blog) => (
            <div
              key={blog._id?.toString()}
              className="bg-gray-800/30 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/edit/${blog._id}`}
                    className="text-lg font-semibold hover:text-[#f97316] transition-colors line-clamp-2"
                    style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
                  >
                    {blog.title || "Untitled"}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(blog.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      blog.status === "published"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {blog.status === "published" ? "LIVE" : "DRAFT"}
                  </span>
                  {blog.status === "published" && (
                    <CopyLinkButton slug={blog.slug} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
