import Link from "next/link";
import Image from "next/image";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  // Fetch user's blog stats for sidebar
  await dbConnect();
  const blogs = await Blog.find({ authorId: userId }).lean();
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const draftCount = blogs.filter((b) => b.status === "draft").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="ChaiAndBlog" width={32} height={32} className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold font-[family-name:var(--font-brand)] tracking-tight">
              Chai<span className="text-[#f97316]">_And_</span>Blog
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/write"
              className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#ea580c] transition-colors flex items-center gap-2"
            >
              <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Write
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 py-8 flex gap-8">
        {/* Sidebar */}
        <DashboardSidebar
          userName={user?.firstName || "Writer"}
          publishedCount={publishedCount}
          draftCount={draftCount}
          totalCount={blogs.length}
        />

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
