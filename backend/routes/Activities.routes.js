import express from "express";
import { saveActivity, getActivities } from "../controllers/Activities.controller.js";

const router = express.Router();

// Save activity for a user
router.post("/save", saveActivity);

// Get activities for a user
router.get("/:userId", getActivities);

export default router;
