import express from "express";
import { setSupabaseSession } from "../middleware/supabase.middleware.js";
import { createDoctorNotes } from "../controllers/Doctor.controller.js";
const router = express.Router();
router.post("/save-note", setSupabaseSession, createDoctorNotes);
export default router;
