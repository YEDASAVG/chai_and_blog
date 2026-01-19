import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Blog from "@/models/Blog";

interface UserProfile {
  name: string;
  username: string;
  avatar?: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
  joinedAt: Date;
  blogs: {
    title: string;
    slug: string;
    createdAt: Date;
    readingTime: number;
  }[];
}

async function getUser(username: string): Promise<UserProfile | null> {
  try {
    await dbConnect();

    const user = await User.findOne({ username }).lean();
    if (!user) return null;

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

    return {
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      twitter: user.twitter || "",
      joinedAt: user.createdAt,
      blogs: blogsWithReadingTime,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUser(username);

  if (!user) {
    notFound();
  }

  const joinDate = new Date(user.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group w-fit">
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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
            <p className="text-gray-400 mb-3">@{user.username}</p>
            {user.bio && (
              <p className="text-gray-300 mb-4 max-w-xl">{user.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex items-center gap-4 flex-wrap">
              {user.github && (
                <a
                  href={user.github.startsWith("http") ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {user.linkedin && (
                <a
                  href={user.linkedin.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {user.twitter && (
                <a
                  href={user.twitter.startsWith("http") ? user.twitter : `https://${user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-sm">Twitter</span>
                </a>
              )}
              <span className="text-gray-500 text-sm">
                Joined {joinDate}
              </span>
            </div>
          </div>
        </div>

        {/* Blogs Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Published Blogs ({user.blogs.length})
          </h2>

          {user.blogs.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/20 rounded-xl border border-gray-800">
              <p className="text-gray-400">No blogs published yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {user.blogs.map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blog/${blog.slug}`}
                  className="block p-5 bg-gray-800/30 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all group"
                >
                  <h3 className="text-lg font-medium text-white group-hover:text-[#f97316] transition-colors mb-2">
                    {blog.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>{blog.readingTime} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
