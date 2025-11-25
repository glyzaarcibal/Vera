import express from "express";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";
import { retrieveChatSessions } from "../controllers/Profile.controller.js";
const router = express.Router();
router.get("/fetch-sessions", setSupabaseSession, retrieveChatSessions);
export default router;
