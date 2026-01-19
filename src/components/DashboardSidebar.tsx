"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  userName?: string;
  publishedCount: number;
  draftCount: number;
  totalCount: number;
}

export default function DashboardSidebar({
  publishedCount,
  draftCount,
  totalCount,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            isActive("/dashboard")
              ? "bg-gray-800/50 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          Dashboard
        </Link>
        <Link
          href="/write"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Write
        </Link>
        <Link
          href="/feed"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            isActive("/feed")
              ? "bg-gray-800/50 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          Feed
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
            isActive("/profile")
              ? "bg-gray-800/50 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800/30"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Profile
        </Link>
      </nav>

      {/* Stats Card */}
      <div className="mt-8 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Your Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Published</span>
            <span className="text-[#f97316] font-semibold">{publishedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Drafts</span>
            <span className="text-yellow-500 font-semibold">{draftCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-white font-semibold">{totalCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
