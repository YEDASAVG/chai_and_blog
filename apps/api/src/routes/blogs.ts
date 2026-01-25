import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  getBlogs,
  createOrUpdateBlog,
  getBlogById,
  deleteBlog,
} from "../controllers/blogController.js";

const router = Router();

// All blog routes require authentication
router.use(requireAuth);
router.use(rateLimit);

// GET /api/v1/blogs - Get user's blogs
router.get("/", getBlogs);

// POST /api/v1/blogs - Create or update a blog
router.post("/", createOrUpdateBlog);

// GET /api/v1/blogs/:id - Get a single blog for editing
router.get("/:id", getBlogById);

// DELETE /api/v1/blogs/:id - Delete a blog
router.delete("/:id", deleteBlog);

export default router;
