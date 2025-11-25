import express from "express";
import {
  fetchUserInfo,
  fetchUsers,
} from "../../controllers/Admin/User.controller.js";
import { getAllSessionsOfByUser } from "../../controllers/Chat/Session.controller.js";
const router = express.Router();

router.get("/get-all-users", fetchUsers);
router.get("/get-sessions-by-user/:userId", getAllSessionsOfByUser);
router.get("/get-user-info/:userId", fetchUserInfo);
export default router;
