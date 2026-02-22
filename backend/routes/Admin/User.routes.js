import express from "express";
import {
  fetchUserInfo,
  fetchUsers,
  fetchAvatarRiskStats,
  getUserEmotionWords,
  fetchUserActivities,
} from "../../controllers/Admin/User.controller.js";
import { getAllSessionsOfByUser } from "../../controllers/Chat/Session.controller.js";
const router = express.Router();

router.get("/get-all-users", fetchUsers);
router.get("/get-sessions-by-user/:userId", getAllSessionsOfByUser);
router.get("/get-user-info/:userId", fetchUserInfo);
router.get("/avatar-risk-stats", fetchAvatarRiskStats);
router.get("/get-emotion-words/:userId", getUserEmotionWords);
router.get("/get-user-activities/:userId", fetchUserActivities);
export default router;
