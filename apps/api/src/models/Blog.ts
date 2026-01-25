import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogDocument extends Document {
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

const BlogSchema = new Schema<IBlogDocument>(
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

// Index for feed pagination
BlogSchema.index({ status: 1, publishedAt: -1 });

const Blog: Model<IBlogDocument> =
  mongoose.models.Blog || mongoose.model<IBlogDocument>("Blog", BlogSchema);

export default Blog;
