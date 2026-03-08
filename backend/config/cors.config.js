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
  
  // ✅ ADDED FOR ANDROID
  "http://localhost",
  "https://localhost", 
  "capacitor://localhost",
  "file://",
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

    // Pattern matching
    const isVercel = normalizedOrigin.endsWith(".vercel.app") ||
      normalizedOrigin.includes("vercel.app");
    
    const isAndroid = normalizedOrigin.includes("localhost") || 
                      normalizedOrigin.startsWith("file://") ||
                      normalizedOrigin === "capacitor://localhost";

    if (isVercel || isAndroid) {
      console.log(`[CORS] Origin allowed by pattern (${isVercel ? 'Vercel' : 'Android'}).`);
      return callback(null, true);
    }

    // If development environment, allow localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin NOT allowed: ${origin}`);
    callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Allow-Origin"],
  optionsSuccessStatus: 200,
};

export default corsConfig;