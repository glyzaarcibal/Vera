import express from "express";
import {
  fetchUserInfo,
  fetchUsers,
  fetchAvatarRiskStats,
  getUserEmotionWords,
  fetchUserActivities,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "../../controllers/Admin/User.controller.js";
import { getAllSessionsOfByUser } from "../../controllers/Chat/Session.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
import { checkAdminRole } from "../../middleware/admin.middleware.js";
const router = express.Router();

router.get("/get-all-users", setSupabaseSession, checkAdminRole, fetchUsers);
router.get("/get-sessions-by-user/:userId", setSupabaseSession, checkAdminRole, getAllSessionsOfByUser);
router.get("/get-user-info/:userId", setSupabaseSession, checkAdminRole, fetchUserInfo);
router.get("/avatar-risk-stats", setSupabaseSession, checkAdminRole, fetchAvatarRiskStats);
router.get("/get-emotion-words/:userId", setSupabaseSession, checkAdminRole, getUserEmotionWords);
router.get("/get-user-activities/:userId", setSupabaseSession, checkAdminRole, fetchUserActivities);

router.post("/create-user", setSupabaseSession, checkAdminRole, createAdminUser);
router.put("/update-user/:userId", setSupabaseSession, checkAdminRole, updateAdminUser);
router.delete("/delete-user/:userId", setSupabaseSession, checkAdminRole, deleteAdminUser);

export default router;
