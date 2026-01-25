// User types
export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  createdAt: Date;
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
  joinedAt: Date;
  blogs: PublicBlogItem[];
}

export interface PublicBlogItem {
  title: string;
  slug: string;
  createdAt: Date;
  readingTime: number;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}
