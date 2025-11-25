import supabaseAdmin from "../../utils/supabase.utils.js";

export async function fetchPermissions(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("permit_store, permit_analyze")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
