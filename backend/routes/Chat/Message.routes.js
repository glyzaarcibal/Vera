import express from "express";
import {
  processMessage,
  saveEviMessage,
} from "../../controllers/Chat/Message.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
const router = express.Router();
router.post("/process-message/:sessionId", setSupabaseSession, processMessage);
router.post("/evi-message/:sessionId", setSupabaseSession, saveEviMessage);
export default router;
