import supabaseAdmin from "../../utils/supabase.utils.js";
import { findUserByEmail } from "./Auth.service.js";

export async function userExists(email) {
  // First, check if user exists in the main Auth pool
  const user = await findUserByEmail(email);
  if (user !== null) return true;

  // Second, check if user exists in the pending_users pool
  const { data: pendingUsers } = await supabaseAdmin
    .from('pending_users')
    .select('id')
    .eq('email', email);

  return pendingUsers && pendingUsers.length > 0;
}

export function isValidPassword(password) {
  return password && password.length >= 8;
}
