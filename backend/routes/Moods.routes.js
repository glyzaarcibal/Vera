import express from "express";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";
import { checkIfUserHasEnteredDailyMood, createDailyMood } from "../controllers/Mood.controller.js";
const router = express.Router();
router.get(
  "/retrieve-daily-moods",
  setSupabaseSession,
  checkIfUserHasEnteredDailyMood
);
router.post(
  "/save-daily-mood",
  setSupabaseSession,
  createDailyMood
);
export default router;
