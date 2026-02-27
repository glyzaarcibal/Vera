import express from "express";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";
import { retrieveChatSessions, retrieveAppointments } from "../controllers/Profile.controller.js";
const router = express.Router();
router.get("/fetch-sessions", setSupabaseSession, retrieveChatSessions);
router.get("/fetch-appointments", setSupabaseSession, retrieveAppointments);
export default router;
