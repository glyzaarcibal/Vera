import {
  createUsers,
  resendVerificationLink,
  verifyUserRegistration,
  getProfile,
} from "../../service/Auth/Auth.service.js";
import {
  isValidPassword,
  userExists,
} from "../../service/Auth/Validators.service.js";
import { supabaseAnon } from "../../utils/supabase.utils.js";
import {
  cookieConfig,
  refreshCookieConfig,
} from "../../config/cookie.config.js";

export const verifyAccount = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // 1. Verify and create auth user
    const { email, password } = await verifyUserRegistration(token);

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
  const { email, password, username } = req.body;
  const isUserExisting = await userExists(email);
  const isPasswordValid = isValidPassword(password);

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields." });
  }
  if (isUserExisting)
    return res.status(409).json({ message: "User already exists." });
  if (!isPasswordValid)
    return res.status(422).json({ message: "Password is invalid." });

  const formData = { email, password, username };
  try {
    const userData = await createUsers(formData);
    return res.status(200).json({ message: "Success" });
  } catch (e) {
    console.log(e);
    if (e.code === "unexpected_failure")
      return res
        .status(400)
        .json({ message: "Invalid Email. Please try again" });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await resendVerificationLink(email);
    return res.status(200).json({ message: "Verification email sent." });
  } catch (e) {
    console.error("Resend verification error:", e);
    return res.status(500).json({ message: "Failed to send verification email." });
  }
};
