import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extract plain text from Tiptap JSON content
export function extractTextFromContent(content: object | null): string {
  if (!content) return "";
  
  function extractText(node: { type?: string; text?: string; content?: object[] }): string {
    if (node.text) return node.text;
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(" ");
    }
    return "";
  }
  
  return extractText(content as { type?: string; text?: string; content?: object[] });
}

// Calculate reading time (average 200 words per minute)
export function calculateReadingTime(content: object | null, title: string = ""): number {
  const text = title + " " + extractTextFromContent(content);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);
  return Math.max(1, readingTime); // At least 1 minute
}

// Count words in content
export function countWords(content: object | null, title: string = ""): number {
  const text = title + " " + extractTextFromContent(content);
  return text.trim().split(/\s+/).filter(Boolean).length;
}
