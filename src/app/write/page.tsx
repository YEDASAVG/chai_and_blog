"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Tiptap
const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  ),
});

export default function WritePage() {
  const router = useRouter();
  const [blogId, setBlogId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const contentRef = useRef(content);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Keep ref updated
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Auto-resize title textarea when title changes (including on load)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("blog-draft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || "");
      setContent(parsed.content || null);
      setBlogId(parsed.blogId || null);
    }
  }, []);

  // Save to localStorage (backup)
  const saveToLocalStorage = useCallback(() => {
    const draft = { title, content: contentRef.current, blogId };
    localStorage.setItem("blog-draft", JSON.stringify(draft));
  }, [title, blogId]);

  // Save to database
  const saveToDB = useCallback(async (status: "draft" | "published" = "draft") => {
    setSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: blogId,
          title: title || "Untitled",
          content: contentRef.current,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const data = await response.json();
      
      // Store the blog ID for future saves
      if (data.blog?.id) {
        setBlogId(data.blog.id);
        // Update localStorage with blog ID
        const draft = { title, content: contentRef.current, blogId: data.blog.id };
        localStorage.setItem("blog-draft", JSON.stringify(draft));
      }

      setLastSaved(new Date());
      setSaveStatus("saved");

      return data;
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus("error");
      // Fallback to localStorage
      saveToLocalStorage();
      return null;
    } finally {
      setSaving(false);
    }
  }, [blogId, title, saveToLocalStorage]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (title || contentRef.current) {
        saveToDB("draft");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, saveToDB]);

  // Manual save
  const handleSaveDraft = async () => {
    await saveToDB("draft");
  };

  // Publish
  const handlePublish = async () => {
    if (!title.trim()) {
      alert("Please add a title");
      return;
    }

    const result = await saveToDB("published");
    
    if (result?.blog?.slug) {
      // Clear draft from localStorage
      localStorage.removeItem("blog-draft");
      // Redirect to the published blog
      router.push(`/blog/${result.blog.slug}`);
    }
  };

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
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <main className="max-w-[700px] mx-auto px-6 py-12">
        {/* Title - Medium style with left label */}
        <div className="relative mb-8">
          {/* Left label - positioned absolutely */}
          <div className="absolute -left-20 top-2 hidden lg:flex items-center gap-3">
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
            autoFocus
          />
        </div>

        {/* Editor - wrapped with relative positioning for plus menu */}
        <div className="relative">
          <Editor
            content={content || undefined}
            onUpdate={(newContent) => setContent(newContent)}
          />
        </div>
      </main>
    </div>
  );
}
