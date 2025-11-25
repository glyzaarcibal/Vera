const isProd = process.env.IS_PROD === "true";

export const cookieConfig = {
  httpOnly: true,
  sameSite: "Lax",
  secure: isProd,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

export const refreshCookieConfig = {
  httpOnly: true,
  sameSite: "Lax", // same reasoning as above
  secure: isProd,
  maxAge: 1000 * 60 * 60 * 24 * 90,
  path: "/",
};
