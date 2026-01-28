import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import User from "@/models/User";
import CopyLinkButton from "@/components/CopyLinkButton";
import BlogContent from "@/components/BlogContent";

// Hoisted regex for word splitting (avoids re-creation on each call)
const WHITESPACE_REGEX = /\s+/;

// Enable ISR - revalidate every 60 seconds for fresh content
export const revalidate = 60;

// Generate static params for published blogs (optional, for static generation)
export async function generateStaticParams() {
  await dbConnect();
  const blogs = await Blog.find({ status: "published" })
    .select("slug")
    .lean();
  
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

// Fetch blog data - cached per request for deduplication
const getBlog = cache(async (slug: string) => {
  await dbConnect();
  const blog = await Blog.findOne({ slug, status: "published" }).lean();
  
  if (!blog) {
    return null;
  }
  
  // If author info is complete, return immediately (fast path)
  if (blog.authorName && blog.authorImage && blog.authorUsername) {
    return {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      authorId: blog.authorId,
      authorName: blog.authorName,
      authorImage: blog.authorImage,
      authorUsername: blog.authorUsername,
      publishedAt: blog.publishedAt?.toISOString() || blog.createdAt.toISOString(),
    };
  }
  
  // Need to fetch missing author info - run DB and Clerk lookups in parallel
  let authorName = blog.authorName;
  let authorImage = blog.authorImage;
  let authorUsername = blog.authorUsername;
  
  const needsDbLookup = !authorUsername || !authorName || !authorImage;
  const needsClerkLookup = !authorName; // Only if name is missing after considering DB
  
  // Start both lookups in parallel
  const [dbUserResult, clerkResult] = await Promise.all([
    needsDbLookup && blog.authorId
      ? User.findOne({ clerkId: blog.authorId }).lean().catch((error) => {
          console.error("Failed to fetch user from DB:", error);
          return null;
        })
      : Promise.resolve(null),
    // Pre-fetch Clerk client (we'll use it conditionally after DB result)
    needsClerkLookup && blog.authorId
      ? clerkClient().then(clerk => clerk.users.getUser(blog.authorId)).catch((error) => {
          console.error("Failed to fetch author from Clerk:", error);
          return null;
        })
      : Promise.resolve(null),
  ]);
  
  // Apply DB user info first
  if (dbUserResult) {
    authorUsername = authorUsername || dbUserResult.username;
    authorName = authorName || dbUserResult.name;
    authorImage = authorImage || dbUserResult.avatar;
  }
  
  // Apply Clerk info only if still needed
  if (!authorName && clerkResult) {
    authorName = clerkResult.firstName 
      ? `${clerkResult.firstName}${clerkResult.lastName ? ` ${clerkResult.lastName}` : ""}`
      : clerkResult.username || "Anonymous";
    authorImage = authorImage || clerkResult.imageUrl || undefined;
    authorUsername = authorUsername || clerkResult.username || undefined;
  }
  
  // Fallback
  authorName = authorName || "Anonymous";
  
  // Update blog with author info for future requests (fire and forget - don't block response)
  if (authorName !== blog.authorName || authorImage !== blog.authorImage || authorUsername !== blog.authorUsername) {
    Blog.updateOne(
      { _id: blog._id }, 
      { authorName, authorImage, authorUsername }
    ).catch(() => {}); // Ignore errors, don't block
  }
  
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    authorId: blog.authorId,
    authorName,
    authorImage: authorImage || null,
    authorUsername: authorUsername || null,
    publishedAt: blog.publishedAt?.toISOString() || blog.createdAt.toISOString(),
  };
});

// Calculate read time
function getReadTime(content: object): number {
  const getText = (node: { type?: string; text?: string; content?: object[] }): string => {
    if (node.text) return node.text;
    if (node.content) return node.content.map(getText).join(" ");
    return "";
  };
  
  const text = getText(content as { content?: object[] });
  const words = text.split(WHITESPACE_REGEX).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  
  if (!blog) {
    notFound();
  }
  
  const readTime = getReadTime(blog.content);
  const publishDate = new Date(blog.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/logo.png" 
              alt="ChaiAndBlog" 
              width={32} 
              height={32} 
              className="w-8 h-8 group-hover:scale-110 transition-transform" 
            />
            <span className="text-xl font-bold font-[family-name:var(--font-brand)] tracking-tight">
              Chai<span className="text-[#f97316]">_And_</span>Blog
            </span>
          </Link>
          
          <CopyLinkButton slug={blog.slug} />
        </div>
      </header>
      
      {/* Article */}
      <article className="max-w-[900px] mx-auto px-6 py-12">
        {/* Title */}
        <h1
          className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight mb-6"
          style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
        >
          {blog.title}
        </h1>
        
        {/* Meta info */}
        <div className="flex items-center gap-4 text-gray-400 mb-12 pb-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {blog.authorUsername ? (
              <Link href={`/user/${blog.authorUsername}`} className="flex items-center gap-3 group">
                {blog.authorImage ? (
                  <Image
                    src={blog.authorImage}
                    alt={blog.authorName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover group-hover:ring-2 ring-[#f97316] transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-medium group-hover:ring-2 ring-white transition-all">
                    {blog.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium group-hover:text-[#f97316] transition-colors">{blog.authorName}</div>
                  <div className="text-sm">
                    {publishDate} · {readTime} min read
                  </div>
                </div>
              </Link>
            ) : (
              <>
                {blog.authorImage ? (
                  <Image
                    src={blog.authorImage}
                    alt={blog.authorName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-medium">
                    {blog.authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{blog.authorName}</div>
                  <div className="text-sm">
                    {publishDate} · {readTime} min read
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div
          className="blog-content"
          style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
        >
          <BlogContent content={blog.content} />
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Written by{" "}
              {blog.authorUsername ? (
                <Link href={`/user/${blog.authorUsername}`} className="text-white hover:text-[#f97316] transition-colors">
                  {blog.authorName}
                </Link>
              ) : (
                <span className="text-white">{blog.authorName}</span>
              )}
            </div>
            <CopyLinkButton slug={blog.slug} />
          </div>
        </div>
      </article>
    </div>
  );
}
