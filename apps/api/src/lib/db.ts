import mongoose from "mongoose";

let isConnected = false;

export async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (isConnected) {
    return mongoose;
  }

  const opts = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  await mongoose.connect(MONGODB_URI, opts);
  isConnected = true;

  return mongoose;
}

export default dbConnect;
