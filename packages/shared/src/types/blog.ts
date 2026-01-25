// Blog types
export interface IBlog {
  _id: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  authorUsername?: string;
  title: string;
  slug: string;
  content: object;
  description?: string;
  tags?: string[];
  coverImage?: string;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface CreateBlogInput {
  id?: string;
  title?: string;
  content?: object;
  status?: "draft" | "published";
  description?: string;
  tags?: string[];
}

export interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
}
