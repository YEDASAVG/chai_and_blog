"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";
import { api, ApiError, type CreateBlogInput, type UpdateProfileInput } from "./api";

/**
 * Custom hook that wraps the API client with Clerk authentication
 * Automatically adds the Bearer token to all requests
 */
export function useApi() {
  const { getToken } = useAuth();

  // Blog operations - memoized with getToken dependency
  const getBlogs = useCallback(
    async (status?: string) => {
      const token = await getToken();
      return api.getBlogs(status, token || undefined);
    },
    [getToken]
  );

  const createOrUpdateBlog = useCallback(
    async (data: CreateBlogInput) => {
      const token = await getToken();
      return api.createOrUpdateBlog(data, token || undefined);
    },
    [getToken]
  );

  const getBlogById = useCallback(
    async (id: string) => {
      const token = await getToken();
      return api.getBlogById(id, token || undefined);
    },
    [getToken]
  );

  const deleteBlog = useCallback(
    async (id: string) => {
      const token = await getToken();
      return api.deleteBlog(id, token || undefined);
    },
    [getToken]
  );

  // Profile operations
  const getProfile = useCallback(async () => {
    const token = await getToken();
    return api.getProfile(token || undefined);
  }, [getToken]);

  const updateProfile = useCallback(
    async (data: UpdateProfileInput) => {
      const token = await getToken();
      return api.updateProfile(data, token || undefined);
    },
    [getToken]
  );

  // Upload operations
  const uploadImage = useCallback(
    async (file: File) => {
      const token = await getToken();
      return api.uploadImage(file, token || undefined);
    },
    [getToken]
  );

  // Memoize the entire return object to prevent unnecessary re-renders
  // when consuming components destructure the hook result
  return useMemo(() => ({
    getBlogs,
    createOrUpdateBlog,
    getBlogById,
    deleteBlog,
    getProfile,
    updateProfile,
    // Public API - no auth needed, stable reference via api module
    getUserByUsername: api.getUserByUsername.bind(api),
    uploadImage,
  }), [
    getBlogs,
    createOrUpdateBlog,
    getBlogById,
    deleteBlog,
    getProfile,
    updateProfile,
    uploadImage,
  ]);
}

export { ApiError };
