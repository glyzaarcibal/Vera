import express from "express";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
import {
  getChatMessages,
  initSession,
} from "../../controllers/Chat/Session.controller.js";
const router = express.Router();

router.post("/start-session/:type", setSupabaseSession, initSession);
router.get("/fetch-chat/:sessionId", getChatMessages);
export default router;
