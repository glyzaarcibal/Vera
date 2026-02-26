import supabaseAdmin from "../utils/supabase.utils.js";

export async function fetchChatSessionsByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("*, chat_messages(*), doctor_notes(*, profiles(first_name, last_name))")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}
