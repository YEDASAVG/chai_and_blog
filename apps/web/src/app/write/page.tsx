"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useToast } from "@/components/Toast";
import { calculateReadingTime, countWords } from "@/lib/utils";
import { useApi, ApiError } from "@/lib/useApi";

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
  const { showToast } = useToast();
  const { createOrUpdateBlog, uploadImage } = useApi();
  const [blogId, setBlogId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<object | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const contentRef = useRef(content);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  // Use ref for publish state to avoid stale closures in intervals
  const isPublishingRef = useRef(false);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate reading time and word count
  const readingTime = useMemo(() => calculateReadingTime(content, title), [content, title]);
  const wordCount = useMemo(() => countWords(content, title), [content, title]);

  // Keep ref updated
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((title || contentRef.current) && !isPublishingRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title]);

  // Auto-resize title textarea when title changes (including on load)
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Load draft from localStorage on mount (for work-in-progress recovery)
  // If the stored blog is already published, clear it and start fresh
  useEffect(() => {
    const loadDraft = async () => {
      const draft = localStorage.getItem("blog-draft");
      if (!draft) return;
      
      try {
        const parsed = JSON.parse(draft);
        
        // If there's a blogId, verify it's still a draft (not published)
        if (parsed.blogId) {
          try {
            const response = await fetch(`/api/blogs/${parsed.blogId}`);
            if (response.ok) {
              const data = await response.json();
              // If blog is published, clear localStorage and start fresh
              if (data.blog?.status === "published") {
                console.log("Stored blog is published, clearing draft");
                localStorage.removeItem("blog-draft");
                return;
              }
            } else if (response.status === 404) {
              // Blog doesn't exist anymore, clear and start fresh
              console.log("Stored blog not found, clearing draft");
              localStorage.removeItem("blog-draft");
              return;
            }
          } catch (error) {
            // Network error, still load the draft but without blogId to avoid conflicts
            console.log("Failed to verify blog status, loading without blogId");
            parsed.blogId = null;
          }
        }
        
        // Only restore if there's actual content
        if (parsed.title || parsed.content) {
          setTitle(parsed.title || "");
          setContent(parsed.content || null);
          setDescription(parsed.description || "");
          setTags(parsed.tags || []);
          setBlogId(parsed.blogId || null);
        }
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem("blog-draft");
      }
    };
    
    loadDraft();
  }, []);

  // Save to localStorage (backup)
  const saveToLocalStorage = useCallback(() => {
    const draft = { title, content: contentRef.current, description, tags, blogId };
    localStorage.setItem("blog-draft", JSON.stringify(draft));
  }, [title, description, tags, blogId]);

  // Save to database
  const saveToDB = useCallback(async (status: "draft" | "published" = "draft") => {
    // Prevent draft saves from overwriting a publish in progress
    if (status === "draft" && isPublishingRef.current) {
      console.log("Skipping draft save - publish in progress");
      return null;
    }
    
    setSaving(true);
    setSaveStatus("saving");

    try {
      const data = await createOrUpdateBlog({
        id: blogId || undefined,
        title: title || "Untitled",
        content: contentRef.current || undefined,
        description,
        tags,
        status,
      });

      // Store the blog ID for future saves (only for drafts, not when publishing)
      if (data.blog?.id && status === "draft") {
        setBlogId(data.blog.id);
        // Update localStorage with blog ID
        const draft = { title, content: contentRef.current, description, tags, blogId: data.blog.id };
        localStorage.setItem("blog-draft", JSON.stringify(draft));
      }

      setLastSaved(new Date());
      setSaveStatus("saved");

      return data;
    } catch (error) {
      console.error("Failed to save:", error);
      
      // If blog not found (stale ID), clear the ID and retry as a new blog
      const isNotFound = error instanceof ApiError 
        ? error.status === 404 
        : (error as { status?: number })?.status === 404 || 
          (error as Error)?.message?.includes("not found");
      
      if (isNotFound && blogId) {
        console.log("Blog ID is stale, creating new blog instead...");
        setBlogId(null);
        localStorage.removeItem("blog-draft");
        
        try {
          const retryData = await createOrUpdateBlog({
            title: title || "Untitled",
            content: contentRef.current || undefined,
            description,
            tags,
            status,
          });

          // Only save to localStorage for drafts
          if (retryData.blog?.id && status === "draft") {
            setBlogId(retryData.blog.id);
            const draft = { title, content: contentRef.current, description, tags, blogId: retryData.blog.id };
            localStorage.setItem("blog-draft", JSON.stringify(draft));
          }
          setLastSaved(new Date());
          setSaveStatus("saved");
          return retryData;
        } catch {
          setSaveStatus("error");
          showToast("Failed to save. Your draft has been saved locally.", "error");
          saveToLocalStorage();
          return null;
        }
      }
      
      setSaveStatus("error");
      showToast("Failed to save. Your draft has been saved locally.", "error");
      // Fallback to localStorage
      saveToLocalStorage();
      return null;
    } finally {
      setSaving(false);
    }
  }, [blogId, title, description, tags, saveToLocalStorage, showToast, createOrUpdateBlog]);

  // Auto-save every 2 minutes (user can manually save anytime)
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      // Use ref to check publishing state (avoids stale closure)
      if ((title || contentRef.current) && !isPublishingRef.current) {
        saveToDB("draft");
      }
    }, 120000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [title, saveToDB]);

  // Manual save
  const handleSaveDraft = async () => {
    await saveToDB("draft");
  };

  // Publish
  const handlePublish = async () => {
    if (!title.trim()) {
      showToast("Please add a title before publishing", "error");
      return;
    }

    // Stop autosave IMMEDIATELY using ref (no async state delay)
    isPublishingRef.current = true;
    setIsPublishing(true);
    
    // Clear the interval to prevent any race conditions
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
    
    // Clear draft from localStorage BEFORE publishing to prevent stale data
    localStorage.removeItem("blog-draft");

    const result = await saveToDB("published");
    
    if (result?.blog?.slug) {
      showToast("Blog published successfully! 🎉", "success");
      // Redirect to the published blog
      router.push(`/blog/${result.blog.slug}`);
    } else {
      // If publish failed, allow autosave again
      isPublishingRef.current = false;
      setIsPublishing(false);
      // Restart auto-save interval
      autoSaveIntervalRef.current = setInterval(() => {
        if ((title || contentRef.current) && !isPublishingRef.current) {
          saveToDB("draft");
        }
      }, 120000);
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-10">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg aria-hidden="true" data-lingo-skip className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Reading time */}
            <span className="text-xs text-gray-500 hidden sm:block">
              {wordCount} words · {readingTime} min read
            </span>

            {/* SEO Settings Toggle */}
            <button
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className={`p-2 rounded-lg transition-colors ${showSeoPanel ? "bg-[#f97316]/20 text-[#f97316]" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              aria-label="SEO Settings"
              aria-expanded={showSeoPanel}
            >
              <svg aria-hidden="true" data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Save status */}
            <span className="text-sm text-gray-500">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-2" aria-live="polite">
                  <svg aria-hidden="true" data-lingo-skip className="w-4 h-4 animate-spin motion-reduce:animate-none" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving…
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
                        aria-label={`Remove tag ${tag}`}
                      >
                        <svg aria-hidden="true" data-lingo-skip className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="relative mb-8">
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

        {/* Editor */}
        <div className="relative">
          <Editor
            content={content || undefined}
            onUpdate={(newContent) => setContent(newContent)}
            onUploadImage={uploadImage}
          />
        </div>
      </main>
    </div>
  );
}
