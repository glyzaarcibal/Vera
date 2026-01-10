const isProd = process.env.IS_PROD === "true";

// For cross-domain cookies (frontend on Vercel, backend on Vercel)
// sameSite: "None" is required along with secure: true
export const cookieConfig = {
  httpOnly: true,
  sameSite: isProd ? "None" : "Lax", // "None" required for cross-site on Vercel
  secure: isProd, // must be true when sameSite is "None"
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

export const refreshCookieConfig = {
  httpOnly: true,
  sameSite: isProd ? "None" : "Lax", // "None" required for cross-site on Vercel
  secure: isProd, // must be true when sameSite is "None"
  maxAge: 1000 * 60 * 60 * 24 * 90,
  path: "/",
};
