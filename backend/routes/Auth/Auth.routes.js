import express from "express";
import { registerUser } from "../../controllers/Auth/Register.controller.js";
import { signIn } from "../../controllers/Auth/Login.controller.js";
import {
  requestPasswordReset,
  retrieveProfileInformation,
  updatePermissions,
  updateProfileInformation,
  uploadProfileAvatar,
} from "../../controllers/Auth.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
import upload from "../../middleware/upload.middleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", signIn);
router.post("/forgot-password", requestPasswordReset);
router.get("/fetch-profile", setSupabaseSession, retrieveProfileInformation);
router.put("/update-profile", setSupabaseSession, updateProfileInformation);
router.put(
  "/upload-avatar",
  setSupabaseSession,
  upload.single("avatar"),
  uploadProfileAvatar
);
router.post("/update-permissions", setSupabaseSession, updatePermissions);
export default router;
