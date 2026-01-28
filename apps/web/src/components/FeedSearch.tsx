"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeedSearch({ initialQuery }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || "");
  const router = useRouter();

  // Debounced live search - triggers 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        router.push(`/feed?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push("/feed");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <div className="relative">
      <label htmlFor="feed-search" className="sr-only">Search articles</label>
      <input
        id="feed-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles…"
        autoComplete="off"
        className="w-64 bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-colors"
      />
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
