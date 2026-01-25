import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const router = Router();

// All profile routes require authentication
router.use(requireAuth);
router.use(rateLimit);

// GET /api/v1/profile - Get current user's profile
router.get("/", getProfile);

// PUT /api/v1/profile - Update profile
router.put("/", updateProfile);

export default router;
