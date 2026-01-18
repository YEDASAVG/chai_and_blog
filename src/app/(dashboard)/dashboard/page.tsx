import Link from "next/link";
import Image from "next/image";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import CopyLinkButton from "@/components/CopyLinkButton";

// Fetch featured blogs (latest published blogs from the community)
async function getFeaturedBlogs(currentUserId: string) {
  const blogs = await Blog.find({ 
    status: "published",
    authorId: { $ne: currentUserId } // Exclude current user's blogs
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title slug authorName authorImage publishedAt")
    .lean();
  return blogs;
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
            {featuredBlogs.map((blog) => (
              <Link
                key={blog._id?.toString()}
                href={`/blog/${blog.slug}`}
                className="group"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-[#f97316]/20 to-purple-500/20 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                  {blog.authorImage ? (
                    <Image
                      src={blog.authorImage}
                      alt={blog.authorName || "Author"}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#f97316]/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-2xl font-bold">
                      {blog.authorName?.[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                </div>
                <h3 
                  className="font-medium group-hover:text-[#f97316] transition-colors line-clamp-2" 
                  style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
                >
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">by {blog.authorName || "Anonymous"}</p>
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
