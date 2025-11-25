import supabaseAdmin from "../utils/supabase.utils.js";

export async function checkMoodByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("daily_mood")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function saveDailyMood(userId, moodScore) {
  const { data, error } = await supabaseAdmin
    .from("daily_mood")
    .insert([
      {
        user_id: userId,
        mood_score: moodScore
      }
    ])
    .select();
  if (error) throw error;
  return data;
}
