"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";
import { useCallback, useState, useEffect, useRef } from "react";
import SectionSeparator from "./extensions/SectionSeparator";
import { useToast } from "./Toast";

const lowlight = createLowlight(common);

interface EditorProps {
  content?: object;
  onUpdate?: (content: object) => void;
  editable?: boolean;
}

export default function Editor({
  content,
  onUpdate,
  editable = true,
}: EditorProps) {
  const { showToast } = useToast();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuPos, setPlusMenuPos] = useState({ top: 0, left: 0 });
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState({ top: 0, left: 0 });
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputPos, setLinkInputPos] = useState({ top: 0, left: 0 });
  const [linkUrl, setLinkUrl] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [tableMenuPos, setTableMenuPos] = useState({ top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // Enable markdown-style input rules
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Tell your story...",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono",
        },
      }),
      CharacterCount,
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: "youtube-embed",
        },
      }),
      SectionSeparator,
      // Typography extension for smart quotes and symbols
      Typography,
      // Table extensions
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-600 bg-gray-800 px-4 py-2 text-left font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-700 px-4 py-2",
        },
      }),
    ],
    content: content || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      if (hasSelection && editorRef.current) {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const editorRect = editorRef.current.getBoundingClientRect();

        setBubbleMenuPos({
          top: start.top - editorRect.top - 50,
          left: (start.left + end.left) / 2 - editorRect.left,
        });
        setShowBubbleMenu(true);
        setShowPlusMenu(false);
        setPlusDropdownOpen(false);
      } else {
        setShowBubbleMenu(false);
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg prose-invert max-w-none focus:outline-none min-h-[400px]",
      },
    },
  });

  // Handle plus menu visibility
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    const checkForEmptyLine = () => {
      const { $from } = editor.state.selection;
      const isEmptyParagraph =
        $from.parent.type.name === "paragraph" &&
        $from.parent.content.size === 0;
      const { from, to } = editor.state.selection;
      const hasNoSelection = from === to;

      if (isEmptyParagraph && hasNoSelection) {
        const { view } = editor;
        const coords = view.coordsAtPos(from);
        const editorRect = editorRef.current!.getBoundingClientRect();

        setPlusMenuPos({
          top: coords.top - editorRect.top - 4,
          left: -40,
        });
        setShowPlusMenu(true);
      } else {
        setShowPlusMenu(false);
        setPlusDropdownOpen(false);
      }
    };

    editor.on("selectionUpdate", checkForEmptyLine);
    editor.on("update", checkForEmptyLine);

    return () => {
      editor.off("selectionUpdate", checkForEmptyLine);
      editor.off("update", checkForEmptyLine);
    };
  }, [editor]);

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);

  // Image upload handler - uploads to ImageKit
  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        // Client-side validation before upload
        const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB (Vercel limit is ~4.5MB)
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!ALLOWED_TYPES.includes(file.type)) {
          showToast("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.", "error");
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          showToast(`Image is too large (${sizeMB}MB). Please use an image smaller than 4MB.`, "error");
          return;
        }

        setIsUploading(true);
        setShowPlusMenu(false);
        setPlusDropdownOpen(false);

        try {
          // Upload to ImageKit via our API
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Upload failed");
          }

          const data = await response.json();
          
          // Insert the permanent ImageKit URL
          editor.chain().focus().setImage({ src: data.url }).run();
        } catch (error) {
          console.error("Image upload failed:", error);
          showToast(error instanceof Error ? error.message : "Failed to upload image. Please try again.", "error");
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  }, [editor, showToast]);

  // Link handler - show custom input
  const openLinkInput = useCallback(() => {
    if (!editor || !editorRef.current) return;
    
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    
    // Position the link input below the bubble menu
    setLinkInputPos({
      top: bubbleMenuPos.top + 50,
      left: bubbleMenuPos.left,
    });
    
    setShowLinkInput(true);
    setShowBubbleMenu(false);
    
    // Focus the input after it renders
    setTimeout(() => {
      linkInputRef.current?.focus();
    }, 10);
  }, [editor, bubbleMenuPos]);

  // Apply the link
  const applyLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  // Handle link input key events
  const handleLinkKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    } else if (e.key === "Escape") {
      setShowLinkInput(false);
      setLinkUrl("");
      editor?.chain().focus().run();
    }
  }, [applyLink, editor]);

  // Video embed handler
  const openVideoInput = useCallback(() => {
    setShowVideoInput(true);
    setShowPlusMenu(false);
    setPlusDropdownOpen(false);
    setTimeout(() => {
      videoInputRef.current?.focus();
    }, 10);
  }, []);

  // Apply the video embed
  const applyVideo = useCallback(() => {
    if (!editor || !videoUrl) return;
    
    // Extract video ID from various YouTube URL formats
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      editor.commands.setYoutubeVideo({
        src: videoUrl,
        width: 640,
        height: 360,
      });
    } else {
      showToast("Please enter a valid YouTube URL", "error");
      return;
    }
    
    setShowVideoInput(false);
    setVideoUrl("");
  }, [editor, videoUrl, showToast]);

  // Handle video input key events
  const handleVideoKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyVideo();
    } else if (e.key === "Escape") {
      setShowVideoInput(false);
      setVideoUrl("");
      editor?.chain().focus().run();
    }
  }, [applyVideo, editor]);

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className="editor-wrapper relative" ref={editorRef}>
      {/* Plus Menu - appears on empty lines */}
      {showPlusMenu && (
        <div
          className="absolute z-20 flex items-center gap-1"
          style={{ top: plusMenuPos.top, left: plusMenuPos.left }}
        >
          <button
            onClick={() => setPlusDropdownOpen(!plusDropdownOpen)}
            className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] transition-colors"
          >
            <svg
              data-lingo-skip
              className={`w-5 h-5 transition-transform ${plusDropdownOpen ? "rotate-45" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {plusDropdownOpen && (
            <div className="absolute left-10 top-0 bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-800 p-1.5 flex gap-0.5">
              <button
                onClick={addImage}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Add Image"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().toggleCodeBlock().run();
                  setShowPlusMenu(false);
                  setPlusDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Code Block"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  setShowPlusMenu(false);
                  setPlusDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Divider"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().toggleBlockquote().run();
                  setShowPlusMenu(false);
                  setPlusDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Quote"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>

              {/* Section Separator (three dots) */}
              <button
                onClick={() => {
                  editor.chain().focus().setSectionSeparator().run();
                  setShowPlusMenu(false);
                  setPlusDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Section Break (⌘+Enter)"
              >
                <span className="text-gray-400 group-hover:text-white text-sm tracking-widest">•••</span>
              </button>

              {/* Video Embed */}
              <button
                onClick={openVideoInput}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Embed Video (YouTube)"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* Table */}
              <button
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setShowPlusMenu(false);
                  setPlusDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors group"
                title="Insert Table"
              >
                <svg
                  data-lingo-skip
                  className="w-[18px] h-[18px] text-gray-400 group-hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video Input Modal */}
      {showVideoInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Embed YouTube Video</h3>
            <input
              ref={videoInputRef}
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={handleVideoKeyDown}
              placeholder="Paste YouTube URL..."
              className="w-full bg-[#0a0a0a] text-white text-sm px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-[#f97316] placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-2">Example: https://youtube.com/watch?v=dQw4w9WgXcQ</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowVideoInput(false);
                  setVideoUrl("");
                  editor?.chain().focus().run();
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyVideo}
                disabled={!videoUrl}
                className="px-4 py-2 text-sm bg-[#f97316] text-white rounded-lg font-medium hover:bg-[#ea580c] disabled:opacity-50 transition-colors"
              >
                Embed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble Menu - appears on text selection */}
      {showBubbleMenu && (
        <div
          className="absolute z-30 bg-[#1a1a1a] text-white rounded-lg shadow-2xl border border-gray-800 flex overflow-hidden"
          style={{
            top: bubbleMenuPos.top,
            left: bubbleMenuPos.left,
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-2 hover:bg-gray-800 transition-colors ${
              editor.isActive("bold") ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Bold (Ctrl+B)"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-2 hover:bg-gray-800 transition-colors ${
              editor.isActive("italic") ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Italic (Ctrl+I)"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-2 hover:bg-gray-800 transition-colors ${
              editor.isActive("underline") ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Underline (Ctrl+U)"
          >
            <span className="underline">U</span>
          </button>
          <div className="w-px bg-gray-700"></div>
          <button
            onClick={openLinkInput}
            className={`px-3 py-2 hover:bg-gray-800 transition-colors ${
              editor.isActive("link") ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Link (Ctrl+K)"
          >
            <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <div className="w-px bg-gray-700"></div>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-3 py-2 hover:bg-gray-800 transition-colors text-sm font-medium ${
              editor.isActive("heading", { level: 1 }) ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-3 py-2 hover:bg-gray-800 transition-colors text-sm font-medium ${
              editor.isActive("heading", { level: 2 }) ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <div className="w-px bg-gray-700"></div>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`px-3 py-2 hover:bg-gray-800 transition-colors ${
              editor.isActive("code") ? "bg-gray-800 text-[#f97316]" : "text-gray-300"
            }`}
            title="Inline Code"
          >
            <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Custom Link Input - Medium style */}
      {showLinkInput && (
        <div
          className="absolute z-40 bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-800 p-1 flex items-center gap-1"
          style={{
            top: linkInputPos.top,
            left: linkInputPos.left,
            transform: "translateX(-50%)",
          }}
        >
          <input
            ref={linkInputRef}
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="Paste or type a link..."
            className="bg-transparent text-white text-sm px-3 py-2 w-64 outline-none placeholder-gray-500"
          />
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
              editor?.chain().focus().run();
            }}
            className="p-2 text-gray-500 hover:text-white transition-colors"
            title="Cancel"
          >
            <svg data-lingo-skip className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Table Controls - appears when cursor is in a table */}
      {editor.isActive("table") && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-[#1a1a1a] rounded-lg shadow-2xl border border-gray-800 p-2 flex items-center gap-1">
          <span className="text-xs text-gray-500 px-2">Table:</span>
          <button
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Add column before"
          >
            + Col ←
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Add column after"
          >
            + Col →
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Add row above"
          >
            + Row ↑
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-1.5 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors"
            title="Add row below"
          >
            + Row ↓
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-1.5 text-xs text-red-400 hover:bg-gray-800 rounded transition-colors"
            title="Delete column"
          >
            − Col
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-1.5 text-xs text-red-400 hover:bg-gray-800 rounded transition-colors"
            title="Delete row"
          >
            − Row
          </button>
          <div className="w-px h-4 bg-gray-700 mx-1"></div>
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-1.5 text-xs text-red-500 hover:bg-gray-800 rounded transition-colors"
            title="Delete table"
          >
            Delete Table
          </button>
        </div>
      )}

      {/* Uploading indicator */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800 p-6 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Uploading image...</span>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word count */}
      <div className="text-right text-sm text-gray-600 mt-8 pt-8 border-t border-gray-800">
        {editor.storage.characterCount?.words() || 0} words
      </div>
    </div>
  );
}
