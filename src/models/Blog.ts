import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  authorId: string;
  authorName?: string;
  authorImage?: string;
  authorUsername?: string;
  title: string;
  slug: string;
  content: object; // Tiptap JSON content
  description?: string; // SEO description
  tags?: string[]; // SEO tags
  coverImage?: string;
  status: "draft" | "published";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    authorName: {
      type: String,
    },
    authorImage: {
      type: String,
    },
    authorUsername: {
      type: String,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      maxlength: 300,
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for feed pagination (published blogs sorted by date)
BlogSchema.index({ status: 1, publishedAt: -1 });

const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
