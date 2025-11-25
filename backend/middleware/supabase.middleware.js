// middleware/setSupabaseSession.js
import supabaseAdmin, { supabaseAnon } from "../utils/supabase.utils.js";
import { cookieConfig, refreshCookieConfig } from "../config/cookie.config.js";

export async function refreshToken(req, res, next) {
  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;

  if (!access_token || !refresh_token) {
    return res.status(400).json({
      message: "Missing access or refresh token",
      error: "Missing access or refresh token",
    });
  }

  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token,
    });

    const { session } = data;

    res.cookie("access_token", session.access_token, cookieConfig);
    res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);

    next();
  } catch (e) {
    return res.status(500).json({
      message: "Invalid or expired token",
      error: "Missing access or refresh token",
    });
  }
}

export async function unsetSession(req, res, next) {
  const { error: signoutError } = await supabaseAdmin.auth.signOut();
  res.clearCookie("access_token", cookieConfig);
  res.clearCookie("refresh_token", refreshCookieConfig);
  if (signoutError) throw signoutError;
  next();
}

export async function setSupabaseSession(req, res, next) {
  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;

  if (!access_token || !refresh_token) {
    return res.status(400).json({
      message: "Missing access or refresh token",
      error: "Missing access or refresh token",
    });
  }

  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token,
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      req.user = data.user;
      req.userId = data.user.id;
    }

    next();
  } catch (e) {
    // console.error("Auth session error:", e.message);
    console.error("Auth session error:", e.message);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: "Missing access or refresh token",
    });
  }
}

export async function checkIfAdmin(req, res, next) {
  const id = req.userId;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(500).json({ message: "Server error" });
  }

  if (data.role != "admin") {
    return res.status(403).json({ message: "Not Admin" });
  }

  next();
}
