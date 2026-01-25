import { Router } from "express";
import { rateLimit } from "../middleware/rateLimit.js";
import { getUserByUsername } from "../controllers/userController.js";

const router = Router();

// Public route - no auth required
router.use(rateLimit);

// GET /api/v1/users/:username - Get public user profile
router.get("/:username", getUserByUsername);

export default router;
