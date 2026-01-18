import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";

async function getBlogCount() {
  await dbConnect();
  return await Blog.countDocuments({ status: "published" });
}

export default async function Home() {
  const { userId } = await auth();

  // If logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  const blogCount = await getBlogCount();

  return (
    <div className="h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#f97316]/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-[8%] opacity-20 animate-float hidden lg:block">
        <div className="w-48 h-32 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-3 transform -rotate-6">
          <div className="flex gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-[#f97316]/40 rounded w-3/4" />
            <div className="h-2 bg-gray-700 rounded w-full" />
            <div className="h-2 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>

      <div className="absolute top-1/3 right-[8%] opacity-20 animate-float-delayed hidden lg:block">
        <div className="w-52 h-36 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 transform rotate-6">
          <div className="h-3 bg-white/30 rounded w-3/4 mb-3" />
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded w-full" />
            <div className="h-2 bg-gray-700 rounded w-5/6" />
            <div className="h-2 bg-gray-700 rounded w-4/5" />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="ChaiAndBlog" width={32} height={32} className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold font-[family-name:var(--font-brand)] bg-gradient-to-r from-white via-[#f97316] to-white bg-clip-text text-transparent bg-[length:200%_auto] hover:animate-gradient tracking-tight">
              Chai<span className="text-[#f97316]">_And_</span>Blog
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/feed"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Feed
            </Link>
            <Link
              href="/sign-in"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="relative z-10 h-[calc(100vh-73px)] flex flex-col items-center justify-center px-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-[#f97316] to-white bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Write. Publish. Share.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            A dead-simple blogging platform for cohort students.
            <br />
            <span className="text-gray-500">No paywalls. No clutter. Just your words.</span>
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/sign-up"
          className="group relative inline-flex items-center gap-2 bg-[#f97316] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[#ea580c] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Start Writing
          <div className="absolute inset-0 rounded-xl bg-[#f97316] blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
        </Link>

        {/* Features + Stats Row */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-center">
          <div className="group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">✍️</div>
            <div className="text-sm font-medium text-white">Beautiful Editor</div>
            <div className="text-xs text-gray-500">Medium-like experience</div>
          </div>
          
          <div className="w-px h-12 bg-gray-800 hidden md:block" />
          
          <div className="group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚡</div>
            <div className="text-sm font-medium text-white">Instant Publish</div>
            <div className="text-xs text-gray-500">One click to go live</div>
          </div>
          
          <div className="w-px h-12 bg-gray-800 hidden md:block" />
          
          <div className="group">
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔗</div>
            <div className="text-sm font-medium text-white">Easy Sharing</div>
            <div className="text-xs text-gray-500">Copy link & submit</div>
          </div>
          
          <div className="w-px h-12 bg-gray-800 hidden md:block" />
          
          <div className="group">
            <div className="text-2xl mb-1 font-bold text-[#f97316] group-hover:scale-110 transition-transform">
              {blogCount}
            </div>
            <div className="text-sm font-medium text-white">Blogs Published</div>
            <div className="text-xs text-gray-500">By the community</div>
          </div>
        </div>

        {/* Footer text */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
            Built with <Image src="/logo.png" alt="" width={16} height={16} className="w-4 h-4 inline" /> for <span className="text-[#f97316] ml-1">ChaiCode</span> Cohort Students
          </p>
        </div>
      </main>
    </div>
  );
}
