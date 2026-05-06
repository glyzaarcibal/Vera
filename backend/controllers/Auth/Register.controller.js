import {
  createUsers,
  getProfile,
  resendVerificationLink,
  verifyUserRegistration,
  createGuardianVerification,
  verifyGuardianConsentCode
} from "../../service/Auth/Auth.service.js";
import {
  isValidPassword,
  userExists,
} from "../../service/Auth/Validators.service.js";
import {
  cookieConfig,
  refreshCookieConfig,
} from "../../config/cookie.config.js";
import { supabaseAnon } from "../../utils/supabase.utils.js";

export const verifyAccount = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Verification code is required" });
  }

  try {
    // 1. Verify and create auth user using the 6-digit code
    const { email, password } = await verifyUserRegistration(code);

    // 2. Automatic login (Automatic pasok)
    const { data, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Auto-login error after verification:", signInError);
      return res.status(200).json({
        message: "Account verified, but auto-login failed. Please sign in manually.",
        verified: true
      });
    }

    const { session, user } = data;
    const profile = await getProfile(user.id);

    // 3. Set cookies
    res.cookie("access_token", session.access_token, cookieConfig);
    res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);

    return res.status(200).json({
      message: "Account verified and logged in successfully",
      profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || "Verification failed" });
  }
};

export const registerUser = async (req, res) => {
  const { email, password, username, contactNumber, birthDate } = req.body;

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields." });
  }
  const isUserExisting = await userExists(email);
  const isPasswordValid = isValidPassword(password);

  if (isUserExisting) {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.session && data?.user) {
      const profile = await getProfile(data.user.id);

      res.cookie("access_token", data.session.access_token, cookieConfig);
      res.cookie("refresh_token", data.session.refresh_token, refreshCookieConfig);

      return res.status(200).json({
        message: "Success",
        profile,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    return res.status(409).json({ message: "User already exists." });
  }
  if (!isPasswordValid)
    return res.status(422).json({ message: "Password is invalid." });

  const formData = { email, password, username, contactNumber, birthDate };
  try {
    const result = await createUsers(formData);
    return res.status(200).json({
      message: result.message || "Please check your email for the verification code."
    });
  } catch (e) {
    console.error("Detailed Registration Error:", e);
    // stringify the error if it's an object to see more details in logs
    if (typeof e === 'object') {
      console.error("Registration Error Body:", JSON.stringify(e, null, 2));
    }
    
    return res.status(500).json({
      message: "Internal Server Error during registration",
      details: e.message || "Unknown error",
      error: e // Sending the full error for debugging
    });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const result = await resendVerificationLink(email);
    return res.status(200).json({ 
      message: result?.message || "Verification code sent to your email.",
      devMode: result?.devMode
    });
  } catch (e) {
    console.error("Resend verification error:", e);
    return res.status(500).json({ 
      message: "Failed to send verification code.",
      error: e.message 
    });
  }
};
export const sendGuardianVerification = async (req, res) => {
  const { childEmail, guardianEmail, childName } = req.body;
  if (!childEmail || !guardianEmail || !childName) {
    return res.status(400).json({ message: "Please fill all required fields for consent." });
  }

  try {
    const result = await createGuardianVerification(childEmail, guardianEmail, childName);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Guardian verification error:", e);
    return res.status(500).json({ message: "Failed to send guardian verification." });
  }
};

export const verifyGuardianConsent = async (req, res) => {
  const { childEmail, verificationCode } = req.body;
  if (!childEmail || !verificationCode) {
    return res.status(400).json({ message: "Missing verification details." });
  }

  try {
    const result = await verifyGuardianConsentCode(childEmail, verificationCode);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Consent verification error:", e);
    return res.status(401).json({ message: e.message || "Invalid or expired code." });
  }
};
