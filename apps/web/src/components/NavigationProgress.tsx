"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevUrlRef = useRef<string>("");

  const startProgress = useCallback(() => {
    setIsNavigating(true);
    setProgress(0);

    // Clear any existing intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Animate progress: fast at start, slows down as it approaches 90%
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) {
        currentProgress = 90;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setProgress(currentProgress);
    }, 200);
  }, []);

  const completeProgress = useCallback(() => {
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Jump to 100% and fade out
    setProgress(100);
    completionTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 300);
  }, []);

  // Track URL changes to detect completed navigation
  const currentUrl = pathname + searchParams.toString();
  
  useEffect(() => {
    // Only complete if URL actually changed and we were navigating
    if (prevUrlRef.current && prevUrlRef.current !== currentUrl && isNavigating) {
      // Defer state update to avoid synchronous setState in effect
      queueMicrotask(() => {
        completeProgress();
      });
    }
    prevUrlRef.current = currentUrl;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [currentUrl, isNavigating, completeProgress]);

  // Listen for click events on links to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor) {
        const href = anchor.getAttribute("href");
        const isInternal = href?.startsWith("/") || href?.startsWith("#");
        const isSamePageAnchor = href?.startsWith("#");
        const isNewTab = anchor.getAttribute("target") === "_blank";
        const isDownload = anchor.hasAttribute("download");
        
        // Start progress for internal navigation (not same-page anchors)
        if (isInternal && !isSamePageAnchor && !isNewTab && !isDownload) {
          // Check if it's actually navigating to a different page
          const currentPath = window.location.pathname + window.location.search;
          if (href !== currentPath) {
            startProgress();
          }
        }
      }
    };

    // Also listen for popstate (browser back/forward)
    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startProgress]);

  if (!isNavigating && progress === 0) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
      className="fixed top-0 left-0 right-0 z-[9999] h-1 pointer-events-none"
    >
      <div
        className="h-full bg-[#f97316] transition-all duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          boxShadow: "0 0 10px rgba(249, 115, 22, 0.7), 0 0 5px rgba(249, 115, 22, 0.5)",
        }}
      />
    </div>
  );
}

// Wrap in Suspense to handle useSearchParams
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
