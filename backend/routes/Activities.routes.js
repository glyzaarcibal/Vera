import express from "express";
import { saveActivity, getActivities } from "../controllers/Activities.controller.js";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";

const router = express.Router();

// Save activity for a user
router.post("/save", setSupabaseSession, saveActivity);

// Get activities for a user
router.get("/", setSupabaseSession, getActivities);

export default router;
