import dotenv from "dotenv";
dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL;

// Allow multiple frontend origins for different environments
const allowedOrigins = [
  FRONTEND_URL,
  "https://vera-7nnk.vercel.app",
  "http://localhost:5173", // Local Vite dev
  "http://localhost:3000", // Alternative local port
  "http://192.168.100.129:5000", // Mobile app backend
].filter(Boolean); // Remove any undefined values

const corsConfig = {
  credentials: true,
  origin: allowedOrigins,
};

export default corsConfig;
