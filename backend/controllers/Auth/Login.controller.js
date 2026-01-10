import {
  cookieConfig,
  refreshCookieConfig,
} from "../../config/cookie.config.js";
import { getProfile } from "../../service/Auth/Auth.service.js";
import { supabaseAnon } from "../../utils/supabase.utils.js";

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug logging for Vercel
    console.log("[LOGIN] Environment:", {
      nodeEnv: process.env.NODE_ENV,
      isProd: process.env.IS_PROD,
      supabaseUrl: process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      frontendUrl: process.env.FRONTEND_URL,
    });
    console.log("[LOGIN] Attempting login for email:", email);

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.log("[LOGIN] Supabase auth error:", error);
      throw error;
    }

    const { session, user } = data;
    const profile = await getProfile(user.id);

    if (profile.status === "inactive") throw new Error("account_inactive");

    res.cookie("access_token", session.access_token, cookieConfig);
    res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);

    console.log("[LOGIN] Login successful for user:", user.id);
    console.log("[LOGIN] Cookie config:", { cookieConfig, refreshCookieConfig });

    return res.status(200).json({
      message: "success",
      profile,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (e) {
    console.log("[LOGIN] Error:", e);
    console.log("[LOGIN] Error code:", e.code);
    console.log("[LOGIN] Error message:", e.message);

    let message = "Internal Server Error";
    let statusCode = 500;

    if (e.code === "email_not_confirmed") {
      message = "Please verify your email to login (We sent you a link on your email)";
      statusCode = 403;
    } else if (e.code === "invalid_credentials") {
      message = "Please check your email and password";
      statusCode = 401;
    } else if (e.message === "account_inactive") {
      message = "Your account is inactive. Please contact support.";
      statusCode = 403;
    }

    return res.status(statusCode).json({ message, error: e.message, code: e.code });
  }
};
