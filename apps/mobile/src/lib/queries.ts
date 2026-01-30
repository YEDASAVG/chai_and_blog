/**
 * TanStack Query Hooks
 * 
 * These hooks replace the manual useState/useCallback approach
 * with TanStack Query's powerful caching and state management.
 * 
 * KEY CONCEPTS:
 * - queryKey: Unique identifier for caching (like a database key)
 * - queryFn: The async function that fetches data
 * - staleTime: How long data is considered "fresh" (no refetch)
 * - gcTime: How long unused data stays in cache before garbage collection
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { api, ApiError, type CreateBlogInput, type UserProfile } from "./api";

// ============================================
// QUERY KEYS
// ============================================
// Centralized keys make cache invalidation predictable
// Example: When a blog is created, we invalidate ['myBlogs'] to refetch

export const queryKeys = {
  // Public
  feed: (search?: string) => ["feed", search] as const,
  blog: (slug: string) => ["blog", slug] as const,
  user: (username: string) => ["user", username] as const,
  
  // Authenticated
  myBlogs: (status?: string) => ["myBlogs", status] as const,
  profile: () => ["profile"] as const,
  blogForEdit: (id: string) => ["blogForEdit", id] as const,
};

// ============================================
// PUBLIC QUERIES (No Auth Required)
// ============================================

/**
 * Infinite scroll feed with search support
 * 
 * useInfiniteQuery is perfect for paginated lists:
 * - Automatically manages page/cursor state
 * - Caches all pages together
 * - Provides fetchNextPage, hasNextPage helpers
 */
export function useFeedQuery(search?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(search),
    queryFn: async ({ pageParam }) => {
      const result = await api.getFeed({
        cursor: pageParam,
        limit: 10,
        search,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Keep feed fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Single blog by slug
 */
export function useBlogQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.blog(slug),
    queryFn: async () => {
      const result = await api.getBlogBySlug(slug);
      return result.blog;
    },
    // Blogs don't change often, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Only fetch if slug exists
    enabled: !!slug,
  });
}

/**
 * Public user profile by username
 */
export function useUserQuery(username: string) {
  return useQuery({
    queryKey: queryKeys.user(username),
    queryFn: () => api.getUserByUsername(username),
    staleTime: 5 * 60 * 1000,
    enabled: !!username,
  });
}

// ============================================
// AUTHENTICATED QUERIES
// ============================================

/**
 * Current user's blogs list
 */
export function useMyBlogsQuery(status?: "draft" | "published") {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.myBlogs(status),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.getMyBlogs(token, status);
      return result.blogs;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Current user's profile
 */
export function useProfileQuery() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      return api.getProfile(token);
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get blog for editing (owner only)
 */
export function useBlogForEditQuery(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.blogForEdit(id),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      const result = await api.getBlogForEdit(token, id);
      return result.blog;
    },
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS (Create, Update, Delete)
// ============================================

/**
 * Save/Update a blog
 * 
 * Mutations handle POST/PUT/DELETE with:
 * - Loading state (isPending)
 * - Error handling
 * - Cache invalidation on success
 */
export function useSaveBlogMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBlogInput) => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      return api.saveBlog(token, data);
    },
    onSuccess: () => {
      // Invalidate myBlogs to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["myBlogs"] });
      // Also invalidate feed since published blogs appear there
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

/**
 * Delete a blog
 */
export function useDeleteBlogMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      return api.deleteBlog(token, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

/**
 * Update user profile
 */
export function useUpdateProfileMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Pick<UserProfile, "name" | "bio" | "github" | "linkedin" | "twitter">>) => {
      const token = await getToken();
      if (!token) throw new ApiError("Not authenticated", "UNAUTHORIZED", 401);
      return api.updateProfile(token, data);
    },
    onSuccess: (result) => {
      // Update cached profile data immediately
      queryClient.setQueryData(queryKeys.profile(), result.user);
    },
  });
}
