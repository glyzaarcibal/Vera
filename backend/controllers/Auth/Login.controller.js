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
      // Check if this user exists in pending_users (registered but not yet verified)
      try {
        const { data: pendingUser } = await supabaseAnon
          .from("pending_users")
          .select("id, email")
          .eq("email", req.body.email)
          .maybeSingle();
        
        if (pendingUser) {
          console.log("[LOGIN] User found in pending_users, needs verification:", pendingUser.email);
          message = "Please verify your email first. Check your inbox for the verification code.";
          statusCode = 403;
        } else {
          message = "Please check your email and password";
          statusCode = 401;
        }
      } catch (pendingErr) {
        console.log("[LOGIN] Error checking pending_users:", pendingErr);
        message = "Please check your email and password";
        statusCode = 401;
      }
    } else if (e.message === "account_inactive") {
      message = "Your account is inactive. Please contact support.";
      statusCode = 403;
    } else if (
      e.message === "fetch failed" ||
      e.code === "ENOTFOUND" ||
      (e.cause && (e.cause.code === "ENOTFOUND" || e.cause.code === "UND_ERR_CONNECT_TIMEOUT"))
    ) {
      message =
        "Authentication service is temporarily unreachable. Check your internet connection. If you use Supabase, ensure your project is not paused.";
      statusCode = 503;
    }

    return res.status(statusCode).json({ message, error: e.message, code: e.code });
  }
};

export const signOut = async (req, res) => {
  try {
    const baseOptions = {
      httpOnly: true,
      path: "/",
    };

    // Clear with all possible combinations to ensure deletion
    const sameSiteOptions = ["Lax", "None", "Strict"];
    const secureOptions = [true, false];

    sameSiteOptions.forEach(sameSite => {
      secureOptions.forEach(secure => {
        const opt = { ...baseOptions, sameSite, secure };
        res.clearCookie("access_token", opt);
        res.clearCookie("refresh_token", opt);
        res.cookie("access_token", "", { ...opt, expires: new Date(0), maxAge: 0 });
        res.cookie("refresh_token", "", { ...opt, expires: new Date(0), maxAge: 0 });
      });
    });

    // Also clear without any options just in case
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    console.log("[LOGOUT] Nuclear cookie clear executed");

    return res.status(200).json({
      message: "success",
    });
  } catch (e) {
    console.error("[LOGOUT] Error during logout:", e);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
