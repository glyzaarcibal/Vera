import supabaseAdmin from "../../utils/supabase.utils.js";
import { findUserByEmail } from "./Auth.service.js";

export async function userExists(email) {
  console.log(`[AUTH] Checking if user exists: ${email}`);
  // First, check if user exists in the main Auth pool
  const user = await findUserByEmail(email);
  if (user !== null) {
    console.log(`[AUTH] User exists in Auth pool: ${email}`);
    return true;
  }

  // Second, check if user exists in the pending_users pool
  const { data: pendingUsers, error } = await supabaseAdmin
    .from('pending_users')
    .select('id')
    .eq('email', email);

  if (error) {
    console.error(`[AUTH] Error checking pending_users for ${email}:`, error);
    throw error;
  }

  const exists = pendingUsers && pendingUsers.length > 0;
  if (exists) {
    console.log(`[AUTH] User exists in pending_users pool: ${email}`);
  }
  return exists;
}

export function isValidPassword(password) {
  return password && password.length >= 8;
}
