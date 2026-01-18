import Link from "next/link";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import FeedSearch from "@/components/FeedSearch";

// Helper: Escape regex special characters to prevent ReDoS attacks
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fetch published blogs with pagination, search, and author info
async function getPublishedBlogs(cursor?: string, search?: string, limit = 10) {
  await dbConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { status: "published" };
  
  if (cursor) {
    query._id = { $lt: cursor };
  }

  // Add search filter if search query exists (title and author)
  // Security: Escape regex special characters to prevent injection
  if (search && search.trim()) {
    const safeSearch = escapeRegex(search.trim()).slice(0, 100); // Limit length too
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { authorName: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const blogs = await Blog.find(query)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = blogs.length > limit;
  const items = hasMore ? blogs.slice(0, limit) : blogs;
  const nextCursor = hasMore ? items[items.length - 1]._id?.toString() : null;

  // Fetch author info from Clerk for blogs missing authorName or authorImage
  const clerk = await clerkClient();
  const blogsWithAuthors = await Promise.all(
    items.map(async (blog) => {
      if (!blog.authorName || !blog.authorImage) {
        try {
          const user = await clerk.users.getUser(blog.authorId);
          const authorName = user.firstName 
            ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
            : user.username || "Anonymous";
          const authorImage = user.imageUrl || null;
          
          // Update the blog in DB for future requests
          await Blog.updateOne(
            { _id: blog._id },
            { authorName, authorImage }
          );
          
          return { ...blog, authorName, authorImage };
        } catch (error) {
          console.error("Failed to fetch author:", error);
          return blog;
        }
      }
      return blog;
    })
  );

  return { blogs: blogsWithAuthors, nextCursor, hasMore };
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { blogs, nextCursor, hasMore } = await getPublishedBlogs(params.cursor, params.q);

  return (
    <>
      {/* Page Title with Search */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold">
              Community Feed
            </h1>
            <p className="text-gray-400 mt-2">
              Discover stories, thinking, and expertise from writers in the cohort.
            </p>
          </div>
          <FeedSearch initialQuery={params.q} />
        </div>
      </div>

      {/* Search Results Info */}
      {params.q && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-gray-400">
            {blogs.length === 0 ? "No results for" : "Results for"}
          </span>
          <span className="text-white font-medium">&quot;{params.q}&quot;</span>
          <Link href="/feed" className="ml-2 text-[#f97316] hover:underline text-sm">
            Clear
          </Link>
        </div>
      )}

      {/* Blog List */}
      {blogs.length === 0 ? (
        <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No blogs yet</h3>
          <p className="text-gray-400 mb-6">Be the first to publish a blog!</p>
          <Link
            href="/write"
            className="inline-block bg-[#f97316] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#ea580c] transition-colors"
          >
            Write the first blog
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {blogs.map((blog) => (
            <article
              key={blog._id?.toString()}
              className="bg-gray-800/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
            >
              <Link href={`/blog/${blog.slug}`}>
                {/* Author info */}
                <div className="flex items-center gap-3 mb-4">
                  {blog.authorImage ? (
                    <Image
                      src={blog.authorImage}
                      alt={blog.authorName || "Author"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-sm font-medium">
                      {blog.authorName?.[0]?.toUpperCase() || "A"}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">{blog.authorName || "Anonymous"}</span>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="text-gray-500">
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="text-xl font-bold mb-2 group-hover:text-[#f97316] transition-colors line-clamp-2"
                  style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
                >
                  {blog.title}
                </h2>

                {/* Preview text */}
                <p className="text-gray-400 line-clamp-2 mb-4">
                  {getPreviewText(blog.content)}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{getReadTime(blog.content)} min read</span>
                </div>
              </Link>
            </article>
          ))}

          {/* Load More */}
          {hasMore && nextCursor && (
            <div className="text-center pt-4">
              <Link
                href={`/feed?cursor=${nextCursor}`}
                className="inline-block px-6 py-3 border border-gray-700 rounded-lg text-sm font-medium hover:border-[#f97316] hover:text-[#f97316] transition-colors"
              >
                Load more blogs
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Helper: Extract preview text from Tiptap JSON content
function getPreviewText(content: { content?: Array<{ type: string; content?: Array<{ text?: string }> }> }): string {
  if (!content || !content.content) return "";

  let text = "";
  for (const node of content.content) {
    if (node.type === "paragraph" && node.content) {
      for (const child of node.content) {
        if (child.text) {
          text += child.text + " ";
        }
      }
    }
    if (text.length > 200) break;
  }

  return text.trim().slice(0, 200) || "No preview available...";
}

// Helper: Estimate read time from content
function getReadTime(content: { content?: Array<{ type: string; content?: Array<{ text?: string }> }> }): number {
  if (!content || !content.content) return 1;

  let wordCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countWords = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.text) {
        wordCount += node.text.split(/\s+/).length;
      }
      if (node.content && Array.isArray(node.content)) {
        countWords(node.content);
      }
    }
  };

  countWords(content.content);

  return Math.max(1, Math.ceil(wordCount / 200));
}
