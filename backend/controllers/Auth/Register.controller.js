import { createUsers, resendVerificationLink, verifyUserRegistration } from "../../service/Auth/Auth.service.js";
import {
  isValidPassword,
  userExists,
} from "../../service/Auth/Validators.service.js";

const getAgeFromBirthday = (birthday) => {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

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
  const { email, password, username } = req.body;

  if (!email || !password || !username || !normalizedBirthday) {
    return res
      .status(400)
      .json({ message: "Please fill all the required fields." });
  }

  const hasValidDate = !Number.isNaN(new Date(`${normalizedBirthday}T00:00:00`).getTime());
  if (!hasValidDate) {
    return res.status(422).json({ message: "Birthday is invalid." });
  }

  if (getAgeFromBirthday(normalizedBirthday) < 13) {
    return res
      .status(422)
      .json({ message: "You must be at least 13 years old to register." });
  }

  if (isUserExisting)
    return res.status(409).json({ message: "User already exists." });
  if (!isPasswordValid)
    return res.status(422).json({ message: "Password is invalid." });

  const formData = { email, password, username };
  try {
    await createUsers(formData);

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { session, user } = data;
    const profile = await getProfile(user.id);

    res.cookie("access_token", session.access_token, cookieConfig);
    res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);

    return res.status(200).json({
      message: "Success",
      profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e) {
    console.error("Detailed Registration Error:", e);
    return res.status(500).json({
      message: "Internal Server Error during registration",
      details: e.message
    });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await resendVerificationLink(email);
    return res.status(200).json({ message: "Verification code sent to your email." });
  } catch (e) {
    console.error("Resend verification error:", e);
    return res.status(500).json({ message: "Failed to send verification code." });
  }
};
