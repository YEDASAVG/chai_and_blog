/**
 * Mobile API Client
 * 
 * Handles all communication with the Express backend.
 * Uses Clerk tokens for authentication.
 */

// API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// Types
export interface FeedBlog {
  id: string;
  title: string;
  slug: string;
  description: string;
  authorName: string;
  authorImage?: string;
  authorUsername?: string;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
}

export interface BlogDetail {
  id: string;
  title: string;
  slug: string;
  content: object;
  description: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  authorUsername?: string;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
  createdAt: string;
}

export interface UserBlog {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
}

export interface PublicUserProfile {
  name: string;
  username: string;
  avatar?: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
  joinedAt: string;
  blogs: Array<{
    title: string;
    slug: string;
    createdAt: string;
    readingTime: number;
  }>;
}

export interface CreateBlogInput {
  id?: string;
  title?: string;
  content?: object;
  status?: "draft" | "published";
  description?: string;
  tags?: string[];
}

// API Error class
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiError";
  }
}

// API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class MobileApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        const error = data.error || { code: "UNKNOWN", message: "An error occurred" };
        throw new ApiError(error.message, error.code, response.status);
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Network error
      throw new ApiError(
        "Unable to connect to server. Please check your internet connection.",
        "NETWORK_ERROR",
        0
      );
    }
  }

  // ============================================
  // PUBLIC ENDPOINTS (no auth required)
  // ============================================

  /**
   * Get public feed of published blogs
   */
  async getFeed(options?: { cursor?: string; limit?: number; search?: string }) {
    const params = new URLSearchParams();
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.search) params.append("search", options.search);

    const query = params.toString();
    return this.request<{ blogs: FeedBlog[]; nextCursor: string | null; hasMore: boolean }>(
      `/feed${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a single published blog by slug
   */
  async getBlogBySlug(slug: string) {
    return this.request<{ blog: BlogDetail }>(`/feed/${slug}`);
  }

  /**
   * Get public user profile by username
   */
  async getUserByUsername(username: string) {
    return this.request<PublicUserProfile>(`/users/${username}`);
  }

  // ============================================
  // AUTHENTICATED ENDPOINTS
  // ============================================

  /**
   * Get current user's blogs
   */
  async getMyBlogs(token: string, status?: "draft" | "published") {
    const params = status ? `?status=${status}` : "";
    return this.request<{ blogs: UserBlog[] }>(`/blogs${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Create or update a blog
   */
  async saveBlog(token: string, data: CreateBlogInput) {
    return this.request<{ blog: { id: string; title: string; slug: string; status: string } }>(
      "/blogs",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  /**
   * Get a single blog for editing (owner only)
   */
  async getBlogForEdit(token: string, id: string) {
    return this.request<{ blog: BlogDetail }>(`/blogs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Delete a blog
   */
  async deleteBlog(token: string, id: string) {
    return this.request<{ message: string }>(`/blogs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Get current user's profile
   */
  async getProfile(token: string) {
    return this.request<UserProfile>("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Update current user's profile
   */
  async updateProfile(
    token: string,
    data: Partial<Pick<UserProfile, "name" | "bio" | "github" | "linkedin" | "twitter">>
  ) {
    return this.request<{ message: string; user: UserProfile }>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

// Export singleton instance
export const api = new MobileApiClient(API_BASE_URL);
