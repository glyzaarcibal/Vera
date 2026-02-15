import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_URL.startsWith("https://")) {
  throw new Error(
    "Supabase: SUPABASE_URL is missing or invalid in .env. It should be https://YOUR_PROJECT_REF.supabase.co"
  );
}
if (!SUPABASE_SERVICE_ROLE) {
  throw new Error("Supabase: SUPABASE_SERVICE_ROLE is missing in .env");
}
if (!SUPABASE_ANON) {
  throw new Error("Supabase: SUPABASE_ANON_KEY is missing in .env");
}

export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export default supabaseAdmin;
