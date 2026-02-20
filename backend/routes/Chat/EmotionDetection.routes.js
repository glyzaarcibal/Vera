import express from "express";
import { emotionFromVoice } from "../../controllers/Chat/EmotionDetection.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";

const router = express.Router();

router.post("/emotion-from-voice", setSupabaseSession, emotionFromVoice);

export default router;
