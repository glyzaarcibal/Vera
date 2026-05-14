import supabaseAdmin from "../../utils/supabase.utils.js";

/**
 * Save a new feedback/report entry
 * @param {Object} feedbackData - The feedback data object
 * @returns {Promise<Object>} - The saved feedback object
 */
export async function createFeedback(feedbackData) {
  const { data, error } = await supabaseAdmin
    .from("feedbacks")
    .insert([feedbackData])
    .select()
    .single();

  if (error) {
    console.error("[Feedback.service] Error saving feedback:", error);
    throw error;
  }

  return data;
}

/**
 * Fetch feedbacks (for admin or user history)
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - List of feedbacks
 */
export async function fetchFeedbacks(filters = {}) {
  let query = supabaseAdmin.from("feedbacks").select("*", { count: "exact" });

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return { data, total: count };
}
