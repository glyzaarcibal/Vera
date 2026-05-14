import express from "express";
import { registerUser, resendVerification, verifyAccount, sendGuardianVerification, verifyGuardianConsent } from "../../controllers/Auth/Register.controller.js";
import { signIn } from "../../controllers/Auth/Login.controller.js";
import {
  requestPasswordReset,
  confirmPasswordReset,
  retrieveProfileInformation,
  updatePermissions,
  updateProfileInformation,
  uploadProfileAvatar,
} from "../../controllers/Auth.controller.js";
import { setSupabaseSession } from "../../middleware/supabase.middleware.js";
import upload from "../../middleware/upload.middleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-account", verifyAccount);
router.post("/resend-verification", resendVerification);
router.post("/login", signIn);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", confirmPasswordReset);
router.post("/send-guardian-verification", sendGuardianVerification);
router.post("/verify-guardian-consent", verifyGuardianConsent);
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
