"use client";

import React from "react";

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string {
  const match = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || "";
}

// Render Tiptap content to HTML
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderContent(content: any): React.ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderNode = (node: any): React.ReactNode => {
    if (!node) return null;
    
    // Text node
    if (node.text) {
      let element: React.ReactNode = node.text;
      
      if (node.marks) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case "bold":
              element = <strong key={Math.random()}>{element}</strong>;
              break;
            case "italic":
              element = <em key={Math.random()}>{element}</em>;
              break;
            case "underline":
              element = <u key={Math.random()}>{element}</u>;
              break;
            case "code":
              element = <code key={Math.random()} className="bg-[rgba(45,45,45,1)] px-[0.4em] py-[0.2em] rounded text-[0.85em] text-[#f97316] font-mono">{element}</code>;
              break;
            case "link":
              // Sanitize href to prevent XSS (javascript: protocol)
              const href = mark.attrs?.href as string;
              const isSafeUrl = href && (
                href.startsWith('http://') || 
                href.startsWith('https://') || 
                href.startsWith('/') || 
                href.startsWith('#') ||
                href.startsWith('mailto:')
              );
              element = isSafeUrl ? (
                <a
                  key={Math.random()}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f97316] underline hover:text-[#ea580c]"
                >
                  {element}
                </a>
              ) : (
                <span key={Math.random()} className="text-[#f97316] underline">
                  {element}
                </span>
              );
              break;
          }
        });
      }
      
      return element;
    }
    
    // Element nodes
    // For table elements, don't wrap in spans (breaks HTML table structure)
    const isTableElement = ["table", "tableRow", "tableHeader", "tableCell"].includes(node.type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children = node.content?.map((child: any, i: number) => {
      const rendered = renderNode(child);
      // Don't wrap table children or if parent is a table element
      if (isTableElement || ["tableRow", "tableHeader", "tableCell"].includes(child.type)) {
        return <React.Fragment key={i}>{rendered}</React.Fragment>;
      }
      return <span key={i}>{rendered}</span>;
    });
    
    switch (node.type) {
      case "doc":
        return <div className="prose-content">{children}</div>;
      
      case "paragraph":
        return <p className="mb-6 text-xl leading-relaxed text-gray-200">{children}</p>;
      
      case "heading":
        const level = node.attrs?.level as number;
        if (level === 1) {
          return <h1 className="text-3xl font-semibold mt-10 mb-4 text-white">{children}</h1>;
        } else if (level === 2) {
          return <h2 className="text-2xl font-semibold mt-8 mb-4 text-white">{children}</h2>;
        } else {
          return <h3 className="text-xl font-semibold mt-6 mb-3 text-white">{children}</h3>;
        }
      
      case "bulletList":
        return <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>;
      
      case "orderedList":
        return <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>;
      
      case "listItem":
        return <li className="text-xl text-gray-200">{children}</li>;
      
      case "blockquote":
        return (
          <blockquote className="border-l-[3px] border-[#f97316] pl-5 my-8 italic text-[rgba(180,180,180,1)]">
            {children}
          </blockquote>
        );
      
      case "codeBlock":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = node.content?.map((c: any) => c.text || "").join("\n");
        return (
          <pre className="bg-[rgba(20,20,20,1)] border border-[rgba(50,50,50,1)] rounded-lg px-6 py-5 my-8 overflow-x-auto">
            <code className="text-sm font-mono text-[rgba(220,220,220,1)] leading-relaxed">{code}</code>
          </pre>
        );
      
      case "horizontalRule":
        return (
          <div className="my-10 text-center tracking-[0.6em] text-lg text-[rgba(100,100,100,1)]">
            • • •
          </div>
        );
      
      case "sectionSeparator":
        return (
          <div className="flex items-center justify-center gap-4 my-12 text-gray-500">
            <span className="text-2xl">•</span>
            <span className="text-2xl">•</span>
            <span className="text-2xl">•</span>
          </div>
        );
      
      case "image":
        const imgSrc = node.attrs?.src as string;
        // Skip blob URLs and validate image source
        const isValidImageSrc = imgSrc && (
          imgSrc.startsWith('https://') || 
          imgSrc.startsWith('http://') ||
          imgSrc.startsWith('/')
        ) && !imgSrc.startsWith('blob:');
        
        // Only allow images from trusted domains
        const trustedDomains = [
          'ik.imagekit.io',           // ImageKit (your CDN)
          'img.clerk.com',            // Clerk user images
          'images.clerk.dev',         // Clerk
          'avatars.githubusercontent.com', // GitHub
          'lh3.googleusercontent.com', // Google
        ];
        const isTrustedSource = isValidImageSrc && trustedDomains.some(domain => imgSrc.includes(domain));
        
        if (!isValidImageSrc) {
          return (
            <figure className="my-8 p-8 bg-gray-800/50 rounded-lg text-center">
              <div className="text-gray-500">Image not available</div>
            </figure>
          );
        }
        
        // For untrusted sources, show a warning
        if (!isTrustedSource) {
          return (
            <figure className="my-8">
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-center">
                <p className="text-yellow-400 text-sm mb-2">⚠️ External image</p>
                <a 
                  href={imgSrc} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#f97316] hover:underline text-sm"
                >
                  View image externally →
                </a>
              </div>
            </figure>
          );
        }
        
        return (
          <figure className="my-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={(node.attrs?.alt as string) || ""}
              width={800}
              height={450}
              className="max-w-full h-auto rounded-lg mx-auto"
              loading="lazy"
            />
            {node.attrs?.title && (
              <figcaption className="text-center text-gray-500 mt-3 text-sm">
                {String(node.attrs.title)}
              </figcaption>
            )}
          </figure>
        );
      
      case "youtube":
        return (
          <div className="my-8 aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(node.attrs?.src as string)}`}
              title="YouTube video player"
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        );
      
      case "table":
        return (
          <div className="my-8 overflow-x-auto">
            <table className="w-full border-collapse border border-[rgba(75,75,75,1)] rounded-lg overflow-hidden">
              <tbody>{children}</tbody>
            </table>
          </div>
        );
      
      case "tableRow":
        return <tr>{children}</tr>;
      
      case "tableHeader":
        const thColspan = node.attrs?.colspan || 1;
        const thRowspan = node.attrs?.rowspan || 1;
        return (
          <th 
            colSpan={thColspan}
            rowSpan={thRowspan}
            className="border border-[rgba(60,60,60,1)] bg-[rgba(40,40,40,1)] px-4 py-3 text-left font-semibold text-white [&>p]:mb-0 [&>p]:text-base"
          >
            {children}
          </th>
        );
      
      case "tableCell":
        const tdColspan = node.attrs?.colspan || 1;
        const tdRowspan = node.attrs?.rowspan || 1;
        return (
          <td 
            colSpan={tdColspan}
            rowSpan={tdRowspan}
            className="border border-[rgba(60,60,60,1)] bg-[rgba(25,25,25,1)] px-4 py-3 text-gray-200 [&>p]:mb-0 [&>p]:text-base"
          >
            {children}
          </td>
        );
      
      default:
        return children;
    }
  };
  
  return renderNode(content);
}

interface BlogContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div data-lingo-skip>
      {renderContent(content)}
    </div>
  );
}
