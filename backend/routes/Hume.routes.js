import express from "express";
import { getEviAccessToken } from "../controllers/Hume.controller.js";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";

const router = express.Router();

router.get("/evi-token", setSupabaseSession, getEviAccessToken);

export default router;
