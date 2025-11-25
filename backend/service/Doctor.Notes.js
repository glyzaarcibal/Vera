import supabaseAdmin from "../utils/supabase.utils.js";

export async function saveDoctorNote(note) {
  const { data, error } = await supabaseAdmin.from("doctor_notes").insert(note);
  if (error) throw error;
  return data;
}
