/**
 * API Client for communicating with the Express backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class ApiClient {
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

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || { code: "UNKNOWN", message: "An error occurred" };
      throw new ApiError(error.message, error.code, response.status);
    }

    return data.data as T;
  }

  // Blog endpoints
  async getBlogs(status?: string, token?: string) {
    const params = status ? `?status=${status}` : "";
    return this.request<{ blogs: BlogListItem[] }>(`/blogs${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async createOrUpdateBlog(data: CreateBlogInput, token?: string) {
    return this.request<{ blog: BlogResponse }>("/blogs", {
      method: "POST",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async getBlogById(id: string, token?: string) {
    return this.request<{ blog: Blog }>(`/blogs/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async deleteBlog(id: string, token?: string) {
    return this.request<{ message: string }>(`/blogs/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Profile endpoints
  async getProfile(token?: string) {
    return this.request<UserProfile>("/profile", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async updateProfile(data: UpdateProfileInput, token?: string) {
    return this.request<{ message: string; user: UserProfile }>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // User endpoints (public)
  async getUserByUsername(username: string) {
    return this.request<PublicUserProfile>(`/users/${username}`);
  }

  // Upload endpoint
  async uploadImage(file: File, token?: string) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseUrl}/upload`;
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data: ApiResponse<UploadResponse> = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || { code: "UNKNOWN", message: "Upload failed" };
      throw new ApiError(error.message, error.code, response.status);
    }

    return data.data as UploadResponse;
  }
}

// Custom error class
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

// Types
interface Blog {
  _id: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  title: string;
  slug: string;
  content: object;
  description?: string;
  tags?: string[];
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface CreateBlogInput {
  id?: string;
  title?: string;
  content?: object;
  status?: "draft" | "published";
  description?: string;
  tags?: string[];
}

interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
}

interface UserProfile {
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
}

interface UpdateProfileInput {
  name?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}

interface PublicUserProfile {
  name: string;
  username: string;
  avatar?: string;
  bio: string;
  github: string;
  linkedin: string;
  twitter: string;
  joinedAt: string;
  blogs: PublicBlogItem[];
}

interface PublicBlogItem {
  title: string;
  slug: string;
  createdAt: string;
  readingTime: number;
}

interface UploadResponse {
  url: string;
  fileId: string;
  name: string;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export types
export type {
  Blog,
  BlogListItem,
  CreateBlogInput,
  BlogResponse,
  UserProfile,
  UpdateProfileInput,
  PublicUserProfile,
  PublicBlogItem,
  UploadResponse,
};
