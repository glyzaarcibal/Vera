import dotenv from "dotenv";
dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL;

const allowedOrigins = [
  FRONTEND_URL,
  "https://vera-7nnk.vercel.app",
  "https://vera-builder.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsConfig = {
  credentials: true,
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
    const normalizedAllowed = allowedOrigins.map(o =>
      typeof o === 'string' ? o.replace(/\/$/, "").toLowerCase() : o
    );

    console.log(`[CORS] Request Origin: ${origin}`);

    // Check direct list
    if (normalizedAllowed.includes(normalizedOrigin)) {
      console.log(`[CORS] Origin allowed by direct list.`);
      return callback(null, true);
    }

    // Vercel Pattern - more robust matching
    const isVercel = normalizedOrigin.endsWith(".vercel.app") ||
      normalizedOrigin.includes("vercel.app");

    if (isVercel) {
      console.log(`[CORS] Origin allowed by Vercel pattern.`);
      return callback(null, true);
    }

    // If development environment, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin NOT allowed: ${origin}`);
    callback(null, false); // Return false instead of throwing Error to prevent 500s
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Allow-Origin"],
  optionsSuccessStatus: 200, // Important for legacy browsers
};


export default corsConfig;
