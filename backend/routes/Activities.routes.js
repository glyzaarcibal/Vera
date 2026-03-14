import express from "express";
import {
	saveActivity,
	getActivities,
	deleteActivity,
} from "../controllers/Activities.controller.js";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";

const router = express.Router();

// Save activity for a user
router.post("/save", setSupabaseSession, saveActivity);

// Get activities for a user
router.get("/", setSupabaseSession, getActivities);

// Delete a specific activity for a user
router.delete("/:activityId", setSupabaseSession, deleteActivity);

export default router;
