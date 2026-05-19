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
    const isSupabaseUnreachable =
      e.message === "fetch failed" ||
      e.code === "ENOTFOUND" ||
      (e.cause && (e.cause.code === "ENOTFOUND" || e.cause.code === "UND_ERR_CONNECT_TIMEOUT"));

    if (isSupabaseUnreachable) {
      return res.status(503).json({
        message:
          "Authentication service is temporarily unreachable. Check your internet connection. If you use Supabase, ensure your project is not paused.",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    return res.status(500).json({
      message: "Invalid or expired token",
      error: e.message || "Missing access or refresh token",
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

// Helper to safely parse JWT payloads locally without external service calls
const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export async function setSupabaseSession(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const bearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

  // Prefer explicit bearer token (mobile clients) and fall back to cookie sessions (web clients).
  if (bearerToken) {
    try {
      const { data, error } = await supabaseAnon.auth.getUser(bearerToken);
      if (error) throw new Error(error.message);
      if (!data?.user) throw new Error("Invalid or expired token");

      req.user = data.user;
      req.userId = data.user.id;
      return next();
    } catch (e) {
      console.error("Auth bearer token error:", e.message);
      return res.status(401).json({
        message: "Invalid or expired token",
        error: e.message || "Invalid or expired token",
      });
    }
  }

  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;

  if (!access_token || !refresh_token) {
    return res.status(401).json({
      message: "Missing access or refresh token",
      error: "Missing access or refresh token",
    });
  }

  // 1. Check if the current access token is valid locally (bypasses GoTrue rate-limits)
  const jwtPayload = parseJwt(access_token);
  if (jwtPayload && jwtPayload.exp && jwtPayload.exp > (Date.now() / 1000) + 10) {
    req.userId = jwtPayload.sub;
    req.user = {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
      app_metadata: jwtPayload.app_metadata || {},
      user_metadata: jwtPayload.user_metadata || {},
    };
    return next();
  }

  // 2. If access token is expired or close to it, call refreshSession and set new cookies
  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token,
    });
    if (error) throw new Error(error.message);

    const { session, user } = data;
    if (session) {
      res.cookie("access_token", session.access_token, cookieConfig);
      res.cookie("refresh_token", session.refresh_token, refreshCookieConfig);
    }

    if (user) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (e) {
    const isSupabaseUnreachable =
      e.message === "fetch failed" ||
      e.code === "ENOTFOUND" ||
      (e.cause && (e.cause.code === "ENOTFOUND" || e.cause.code === "UND_ERR_CONNECT_TIMEOUT"));

    if (isSupabaseUnreachable) {
      console.warn("[Auth] Supabase unreachable, returning 503. Check connection or restore paused project.");
      return res.status(503).json({
        message:
          "Authentication service is temporarily unreachable. Check your internet connection. If you use Supabase, ensure your project is not paused.",
        code: "SERVICE_UNAVAILABLE",
      });
    }

    console.error("Auth session error:", e.message);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: e.message || "Missing access or refresh token",
    });
  }
}

export async function checkIfAdmin(req, res, next) {
  const id = req.userId;

  try {
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
  } catch (e) {
    const isSupabaseUnreachable =
      e.message === "fetch failed" ||
      e.code === "ENOTFOUND" ||
      (e.cause && (e.cause.code === "ENOTFOUND" || e.cause.code === "UND_ERR_CONNECT_TIMEOUT"));

    if (isSupabaseUnreachable) {
      return res.status(503).json({
        message:
          "Authentication service is temporarily unreachable. Check your internet connection.",
        code: "SERVICE_UNAVAILABLE",
      });
    }
    throw e;
  }
}
