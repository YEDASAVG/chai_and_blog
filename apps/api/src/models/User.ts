import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
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

const UserSchema = new Schema<IUserDocument>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 300,
    },
    github: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    twitter: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
