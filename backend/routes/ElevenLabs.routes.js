import express from "express";
import multer from "multer";
import { speechToText, textToSpeech } from "../controllers/ElevenLabs.controller.js";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/speech-to-text", setSupabaseSession, upload.single("file"), speechToText);
router.post("/text-to-speech/:voiceId", setSupabaseSession, textToSpeech);

export default router;
