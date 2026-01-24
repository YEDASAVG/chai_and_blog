"use client";

import { useState, useEffect, useCallback, useRef, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useToast } from "@/components/Toast";
import { calculateReadingTime, countWords } from "@/lib/utils";

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
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [slug, setSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const contentRef = useRef(content);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Calculate reading time and word count
  const readingTime = useMemo(() => calculateReadingTime(content, title), [content, title]);
  const wordCount = useMemo(() => countWords(content, title), [content, title]);

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
        setDescription(data.blog.description || "");
        setTags(data.blog.tags || []);
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
          description,
          tags,
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
      showToast("Failed to save changes", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }, [id, title, status, description, tags, showToast]);

  // Auto-save every 30 seconds - ONLY for drafts (and not during publish)
  useEffect(() => {
    if (loading || notFound || status === "published" || isPublishing) return;

    const interval = setInterval(() => {
      if (title || contentRef.current) {
        saveToDB();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, saveToDB, loading, notFound, status, isPublishing]);

  // Manual save draft
  const handleSaveDraft = async () => {
    await saveToDB("draft");
  };

  // Update (for published blogs) - saves without redirect
  const handleUpdate = async () => {
    if (!title.trim()) {
      showToast("Please add a title", "error");
      return;
    }
    const result = await saveToDB("published");
    if (result) {
      showToast("Blog updated successfully!", "success");
    }
  };

  // Publish (for drafts) - saves and updates status
  const handlePublish = async () => {
    if (!title.trim()) {
      showToast("Please add a title before publishing", "error");
      return;
    }
    
    // Stop autosave from reverting to draft
    setIsPublishing(true);
    
    const result = await saveToDB("published");
    if (result) {
      showToast("Blog published successfully! 🎉", "success");
    } else {
      // If publish failed, allow autosave again
      setIsPublishing(false);
    }
  };

  // Delete blog
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      showToast("Blog deleted successfully", "success");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete:", error);
      showToast("Failed to delete blog", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Tag handlers
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
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
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-2">Delete Blog</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete &quot;{title || "Untitled"}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleting && (
                  <svg data-lingo-skip className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg data-lingo-skip className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Reading time */}
            <span className="text-xs text-gray-500 hidden sm:block">
              {wordCount} words · {readingTime} min read
            </span>

            {/* Status indicator */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              status === "published"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
            }`}>
              {status === "published" ? "PUBLISHED" : "DRAFT"}
            </span>

            {/* SEO Settings Toggle */}
            <button
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className={`p-2 rounded-lg transition-colors ${showSeoPanel ? "bg-[#f97316]/20 text-[#f97316]" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              title="SEO Settings"
            >
              <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* View Published Link - only for published blogs */}
            {status === "published" && slug && (
              <Link
                href={`/blog/${slug}`}
                target="_blank"
                className="p-2 text-gray-400 hover:text-[#f97316] hover:bg-gray-800 rounded-lg transition-colors"
                title="View Published"
              >
                <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            )}

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Delete Blog"
            >
              <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Save status */}
            <span className="text-sm text-gray-500">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-2">
                  <svg data-lingo-skip className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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

      {/* SEO Panel */}
      {showSeoPanel && (
        <div className="border-b border-gray-800 bg-[#0a0a0a]">
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <h3 className="text-sm font-medium text-white mb-4">SEO Settings</h3>
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Meta Description ({description.length}/300)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                  placeholder="A brief description of your blog for search engines..."
                  className="w-full bg-[#1a1a1a] text-white text-sm px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-[#f97316] placeholder-gray-500 resize-none"
                  rows={2}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Tags ({tags.length}/5)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#f97316]/20 text-[#f97316] text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <svg data-lingo-skip className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                {tags.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value.slice(0, 30))}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add a tag..."
                      className="flex-1 bg-[#1a1a1a] text-white text-sm px-4 py-2 rounded-lg border border-gray-700 outline-none focus:border-[#f97316] placeholder-gray-500"
                    />
                    <button
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <main className="max-w-[900px] mx-auto px-6 py-12">
        {/* Title */}
        <div className="relative mb-4">
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
