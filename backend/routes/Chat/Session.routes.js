import express from "express";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
import {
  analyzeSession,
  getChatMessages,
  initSession,
} from "../../controllers/Chat/Session.controller.js";
const router = express.Router();

router.post("/start-session/:type", setSupabaseSession, initSession);
router.post("/analyze/:sessionId", setSupabaseSession, analyzeSession);
router.get("/fetch-chat/:sessionId", getChatMessages);
export default router;
