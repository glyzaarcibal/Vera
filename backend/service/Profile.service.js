import supabaseAdmin from "../utils/supabase.utils.js";

export async function fetchChatSessionsByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("*, chat_messages(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}
