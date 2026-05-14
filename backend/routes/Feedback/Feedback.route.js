import express from "express";
import { submitFeedback, getFeedbacks } from "../../controllers/Feedback/Feedback.controller.js";
import { setSupabaseSession, checkIfAdmin } from "../../middleware/supabase.middleware.js";
import multer from "multer";

const router = express.Router();

// Multer setup: using memory storage to pass buffer directly to Supabase storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @route POST /api/feedback/submit
 * @description Submit feedback or report an issue (optionally with an image)
 * @access Private
 */
router.post("/submit", setSupabaseSession, upload.single("image"), submitFeedback);

/**
 * @route GET /api/feedback/all
 * @description Fetch ALL feedbacks (Admin only)
 * @access Private/Admin
 */
router.get("/all", setSupabaseSession, checkIfAdmin, getFeedbacks);

/**
 * @route GET /api/feedback/me
 * @description Fetch user's own feedback history
 * @access Private
 */
router.get("/me", setSupabaseSession, getFeedbacks);

export default router;
