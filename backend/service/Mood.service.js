import supabaseAdmin from "../utils/supabase.utils.js";

export async function checkMoodByUserId(userId) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const { data, error } = await supabaseAdmin
    .from("daily_mood")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startOfToday.toISOString())
    .lt("created_at", startOfTomorrow.toISOString());
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
