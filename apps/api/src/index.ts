import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from monorepo root (3 levels up from src/index.ts)
// override: true ensures .env file takes precedence over shell environment
config({ path: resolve(__dirname, "../../../.env"), override: true });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { dbConnect } from "./lib/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import blogRoutes from "./routes/blogs.js";
import profileRoutes from "./routes/profile.js";
import userRoutes from "./routes/user.js";
import uploadRoutes from "./routes/upload.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware (makes auth available on all routes)
app.use(clerkMiddleware());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Error handling
app.use(errorHandler);

// Start server
async function start() {
  try {
    await dbConnect();
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
