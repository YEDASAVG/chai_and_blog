import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import CopyLinkButton from "@/components/CopyLinkButton";

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

// Fetch blog data
async function getBlog(slug: string) {
  await dbConnect();
  const blog = await Blog.findOne({ slug, status: "published" }).lean();
  
  if (!blog) {
    return null;
  }
  
  // If authorName or authorImage is not set, fetch from Clerk
  let authorName = blog.authorName;
  let authorImage = blog.authorImage;
  
  if ((!authorName || !authorImage) && blog.authorId) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(blog.authorId);
      authorName = authorName || (user.firstName 
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
        : user.username || "Anonymous");
      authorImage = authorImage || user.imageUrl || undefined;
      
      // Update the blog with author info for future requests
      await Blog.updateOne({ _id: blog._id }, { authorName, authorImage });
    } catch (error) {
      console.error("Failed to fetch author info:", error);
      authorName = authorName || "Anonymous";
    }
  }
  
  return {
    id: blog._id.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    authorId: blog.authorId,
    authorName: authorName || "Anonymous",
    authorImage: authorImage || null,
    publishedAt: blog.publishedAt?.toISOString() || blog.createdAt.toISOString(),
  };
}

// Calculate read time
function getReadTime(content: object): number {
  const getText = (node: { type?: string; text?: string; content?: object[] }): string => {
    if (node.text) return node.text;
    if (node.content) return node.content.map(getText).join(" ");
    return "";
  };
  
  const text = getText(content as { content?: object[] });
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Render Tiptap content to HTML
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderContent(content: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderNode = (node: any): React.ReactNode => {
    if (!node) return null;
    
    // Text node
    if (node.text) {
      let element: React.ReactNode = node.text;
      
      if (node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case "bold":
              element = <strong key={Math.random()}>{element}</strong>;
              break;
            case "italic":
              element = <em key={Math.random()}>{element}</em>;
              break;
            case "underline":
              element = <u key={Math.random()}>{element}</u>;
              break;
            case "code":
              element = <code key={Math.random()} className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-[#f97316]">{element}</code>;
              break;
            case "link":
              element = (
                <a
                  key={Math.random()}
                  href={mark.attrs?.href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f97316] underline hover:text-[#ea580c]"
                >
                  {element}
                </a>
              );
              break;
          }
        });
      }
      
      return element;
    }
    
    // Element nodes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children = node.content?.map((child: any, i: number) => (
      <span key={i}>{renderNode(child)}</span>
    ));
    
    switch (node.type) {
      case "doc":
        return <div className="prose-content">{children}</div>;
      
      case "paragraph":
        return <p className="mb-6 text-xl leading-relaxed text-gray-200">{children}</p>;
      
      case "heading":
        const level = node.attrs?.level as number;
        if (level === 1) {
          return <h1 className="text-3xl font-semibold mt-10 mb-4 text-white">{children}</h1>;
        } else if (level === 2) {
          return <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">{children}</h2>;
        } else {
          return <h3 className="text-xl font-semibold mt-6 mb-3 text-white">{children}</h3>;
        }
      
      case "bulletList":
        return <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>;
      
      case "orderedList":
        return <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>;
      
      case "listItem":
        return <li className="text-xl text-gray-200">{children}</li>;
      
      case "blockquote":
        return (
          <blockquote className="border-l-4 border-[#f97316] pl-6 my-8 italic text-gray-300">
            {children}
          </blockquote>
        );
      
      case "codeBlock":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = node.content?.map((c: any) => c.text || "").join("\n");
        return (
          <pre className="bg-gray-900 rounded-lg p-4 my-6 overflow-x-auto">
            <code className="text-sm font-mono text-gray-100">{code}</code>
          </pre>
        );
      
      case "horizontalRule":
        return <hr className="my-10 border-gray-700" />;
      
      case "sectionSeparator":
        return (
          <div className="flex items-center justify-center gap-4 my-12 text-gray-500">
            <span className="text-2xl">•</span>
            <span className="text-2xl">•</span>
            <span className="text-2xl">•</span>
          </div>
        );
      
      case "image":
        const imgSrc = node.attrs?.src as string;
        // Skip blob URLs (they don't persist)
        if (!imgSrc || imgSrc.startsWith("blob:")) {
          return (
            <figure className="my-8 p-8 bg-gray-800/50 rounded-lg text-center">
              <div className="text-gray-500">Image not available</div>
            </figure>
          );
        }
        return (
          <figure className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={(node.attrs?.alt as string) || ""}
              className="max-w-full h-auto rounded-lg mx-auto"
              loading="lazy"
            />
            {node.attrs?.title && (
              <figcaption className="text-center text-gray-500 mt-3 text-sm">
                {String(node.attrs.title)}
              </figcaption>
            )}
          </figure>
        );
      
      case "youtube":
        return (
          <div className="my-8 aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(node.attrs?.src as string)}`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      
      default:
        return children;
    }
  };
  
  return renderNode(content);
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string {
  const match = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || "";
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
          <Link
            href="/feed"
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back to Feed</span>
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
          </div>
        </div>
        
        {/* Content */}
        <div
          className="blog-content"
          style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
        >
          {renderContent(blog.content)}
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Written by <span className="text-white">{blog.authorName}</span>
            </div>
            <CopyLinkButton slug={blog.slug} />
          </div>
        </div>
      </article>
    </div>
  );
}
