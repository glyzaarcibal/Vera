import dotenv from "dotenv";
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL;

const allowedOrigins = [
  FRONTEND_URL,
  "https://vera-7nnk.vercel.app",
  "https://vera-builder.vercel.app",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsConfig = {
  credentials: true,
  origin: function (origin, callback) {
    // 1. Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();

    // 2. Check if the origin is in our explicit allowed list
    const isExplicitlyAllowed = allowedOrigins.some((o) => {
      if (!o) return false;
      return o.replace(/\/$/, "").toLowerCase() === normalizedOrigin;
    });

    if (isExplicitlyAllowed) {
      return callback(null, true);
    }

    // 3. Allow any Vercel deployment (for preview branches)
    if (normalizedOrigin.endsWith(".vercel.app") || normalizedOrigin.includes("vercel.app")) {
      return callback(null, true);
    }

    // 4. Allow localhost in development
    if (normalizedOrigin.includes("localhost") || normalizedOrigin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    // 5. If not allowed, we log it but don't necessarily crash the server
    console.warn(`[CORS] Origin NOT allowed: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin",
  ],
  exposedHeaders: ["Set-Cookie"], // Important for cross-origin cookies
  optionsSuccessStatus: 200,
};

export default corsConfig;
