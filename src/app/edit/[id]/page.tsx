"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Tiptap
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
    </div>
  ),
});

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const contentRef = useRef(content);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Keep ref updated
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Auto-resize title textarea when title changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Load blog from database
  useEffect(() => {
    async function loadBlog() {
      try {
        const response = await fetch(`/api/blogs/${id}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            setNotFound(true);
          }
          return;
        }

        const data = await response.json();
        setTitle(data.blog.title || "");
        setContent(data.blog.content || null);
        setStatus(data.blog.status || "draft");
        setSlug(data.blog.slug || null);
      } catch (error) {
        console.error("Failed to load blog:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadBlog();
  }, [id]);

  // Save to database (without changing status for published blogs)
  const saveToDB = useCallback(async (newStatus?: "draft" | "published") => {
    setSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: title || "Untitled",
          content: contentRef.current,
          status: newStatus || status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();
      setLastSaved(new Date());
      setSaveStatus("saved");

      if (newStatus === "published") {
        setStatus("published");
        setSlug(data.blog.slug);
      }

      return data;
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus("error");
      return null;
    } finally {
      setSaving(false);
    }
  }, [id, title, status]);

  // Auto-save every 30 seconds - ONLY for drafts
  useEffect(() => {
    if (loading || notFound || status === "published") return;

    const interval = setInterval(() => {
      if (title || contentRef.current) {
        saveToDB();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, saveToDB, loading, notFound, status]);

  // Manual save draft
  const handleSaveDraft = async () => {
    await saveToDB("draft");
  };

  // Update (for published blogs) - saves without redirect
  const handleUpdate = async () => {
    if (!title.trim()) {
      alert("Please add a title");
      return;
    }
    await saveToDB("published");
  };

  // Publish (for drafts) - saves and updates status
  const handlePublish = async () => {
    if (!title.trim()) {
      alert("Please add a title");
      return;
    }
    await saveToDB("published");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog not found</h1>
          <p className="text-gray-400 mb-8">
            This blog doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <Link
            href="/dashboard"
            className="bg-[#f97316] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#ea580c] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
        <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              status === "published"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
            }`}>
              {status === "published" ? "PUBLISHED" : "DRAFT"}
            </span>

            {/* View Published Link - only for published blogs */}
            {status === "published" && slug && (
              <Link
                href={`/blog/${slug}`}
                target="_blank"
                className="text-sm text-gray-400 hover:text-[#f97316] flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View
              </Link>
            )}

            {/* Save status */}
            <span className="text-sm text-gray-500">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && lastSaved && (
                <span className="text-green-500">✓ Saved</span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-400">Failed to save</span>
              )}
            </span>

            {/* Different buttons based on status */}
            {status === "draft" ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  Save draft
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving || !title.trim()}
                  className="px-5 py-2 text-sm bg-[#f97316] text-white rounded-lg font-medium hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Publish
                </button>
              </>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={saving || !title.trim()}
                className="px-5 py-2 text-sm bg-[#f97316] text-white rounded-lg font-medium hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <main className="max-w-[700px] mx-auto px-6 py-12">
        {/* Title - Medium style with left label */}
        <div className="relative mb-4">
          {/* Left label - positioned absolutely */}
          <div className="absolute -left-24 top-2 flex items-center gap-3">
            <span className="text-sm text-gray-500">Title</span>
            <div className="w-px h-8 bg-gray-600"></div>
          </div>

          {/* Title textarea */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full text-[42px] font-medium border-none outline-none bg-transparent placeholder-gray-600 leading-tight tracking-tight text-white resize-none overflow-hidden"
            style={{ fontFamily: "var(--font-serif), Georgia, Cambria, serif" }}
            rows={1}
          />
        </div>

        {/* Editor */}
        {content !== null && (
          <Editor
            content={content}
            onUpdate={(newContent) => setContent(newContent)}
          />
        )}
      </main>
    </div>
  );
}
