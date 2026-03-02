import dotenv from "dotenv";
dotenv.config();

const isProd =
  process.env.IS_PROD === "true" || process.env.NODE_ENV === "production";
const forceCrossSiteCookies =
  process.env.COOKIE_SAMESITE?.toLowerCase() === "none";
const sameSite = forceCrossSiteCookies || isProd ? "None" : "Lax";
const secure = sameSite === "None" ? true : isProd;

// For cross-domain cookies (frontend on Vercel, backend on Vercel)
// sameSite: "None" is required along with secure: true
export const cookieConfig = {
  httpOnly: true,
  sameSite, // "None" required for cross-site cookies (frontend/backend on different domains)
  secure, // must be true when sameSite is "None"
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

export const refreshCookieConfig = {
  httpOnly: true,
  sameSite, // "None" required for cross-site cookies (frontend/backend on different domains)
  secure, // must be true when sameSite is "None"
  maxAge: 1000 * 60 * 60 * 24 * 90,
  path: "/",
};
