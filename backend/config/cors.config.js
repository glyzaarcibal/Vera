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
      console.log(`[CORS] No origin provided. Allowing.`);
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");
    const normalizedAllowed = allowedOrigins.map(o => typeof o === 'string' ? o.replace(/\/$/, "") : o);

    console.log(`[CORS] Request Origin: ${origin}`);

    // Check if it's an allowed direct URL
    if (normalizedAllowed.includes(normalizedOrigin)) {
      console.log(`[CORS] Origin allowed by direct list.`);
      return callback(null, true);
    }

    // Check if it's a Vercel preview/production URL
    const isVercel = normalizedOrigin.endsWith(".vercel.app") ||
      /https:\/\/vera-.*\.vercel\.app$/.test(normalizedOrigin);

    if (isVercel) {
      console.log(`[CORS] Origin allowed by Vercel pattern.`);
      return callback(null, true);
    }

    // Default: Not allowed
    console.warn(`[CORS] Origin NOT allowed: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
};


export default corsConfig;
