/**
 * React hooks for API calls
 * 
 * Provides easy-to-use hooks that integrate with Clerk auth
 * and React state management.
 */

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { api, ApiError, FeedBlog, BlogDetail, UserProfile, CreateBlogInput } from "./api";

// ============================================
// Feed Hook (Public)
// ============================================

export interface UseFeedOptions {
  initialLimit?: number;
}

export function useFeed(options?: UseFeedOptions) {
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const limit = options?.initialLimit || 10;

  // Load initial or refresh
  const loadBlogs = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getFeed({ limit, search });
      setBlogs(result.blogs);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setSearchQuery(search || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Pull to refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await api.getFeed({ limit, search: searchQuery });
      setBlogs(result.blogs);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }, [limit, searchQuery]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;

    setLoading(true);
    try {
      const result = await api.getFeed({ cursor, limit, search: searchQuery });
      setBlogs((prev) => [...prev, ...result.blogs]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, limit, searchQuery]);

  // Search
  const search = useCallback((query: string) => {
    loadBlogs(query);
  }, [loadBlogs]);

  return {
    blogs,
    loading,
    refreshing,
    error,
    hasMore,
    searchQuery,
    loadBlogs,
    refresh,
    loadMore,
    search,
  };
}

// ============================================
// Blog Detail Hook (Public)
// ============================================

export function useBlogDetail(slug: string) {
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getBlogBySlug(slug);
      setBlog(result.blog);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load blog");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  return { blog, loading, error, loadBlog };
}

// ============================================
// My Blogs Hook (Authenticated)
// ============================================

export function useMyBlogs() {
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMyBlogs = useCallback(async (status?: "draft" | "published") => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.getMyBlogs(token, status);
      setBlogs(result.blogs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return { blogs, loading, error, loadMyBlogs };
}

// ============================================
// Save Blog Hook (Authenticated)
// ============================================

export function useSaveBlog() {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveBlog = useCallback(async (data: CreateBlogInput) => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.saveBlog(token, data);
      return result.blog;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save blog";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [getToken]);

  return { saveBlog, saving, error };
}

// ============================================
// Profile Hook (Authenticated)
// ============================================

export function useProfile() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.getProfile(token);
      setProfile(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const updateProfile = useCallback(async (
    data: Partial<Pick<UserProfile, "name" | "bio" | "github" | "linkedin" | "twitter">>
  ) => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.updateProfile(token, data);
      setProfile(result.user);
      return result.user;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update profile";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [getToken]);

  return { profile, loading, saving, error, loadProfile, updateProfile };
}

// ============================================
// Public User Profile Hook
// ============================================

export function useUserProfile(username: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getUserByUsername(username);
      setUser(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [username]);

  return { user, loading, error, loadUser };
}
