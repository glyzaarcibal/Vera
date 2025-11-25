import express from "express";
import { processMessage } from "../../controllers/Chat/Message.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
const router = express.Router();
router.post("/process-message/:sessionId", setSupabaseSession, processMessage);
export default router;
