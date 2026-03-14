import supabaseAdmin from "../utils/supabase.utils.js";

export async function saveActivityToDB(userId, activityType, data) {
  // Save activity data per user
  const { error } = await supabaseAdmin
    .from("activities")
    .insert([{ user_id: userId, activity_type: activityType, data }]);
  if (error) throw new Error(error.message);
}

export async function getActivitiesFromDB(userId) {
  // Get all activities for a user
  const { data, error } = await supabaseAdmin
    .from("activities")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteActivityFromDB(userId, activityId) {
  const { data, error } = await supabaseAdmin
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw new Error(error.message);
  return data || [];
}
