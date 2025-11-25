import supabaseAdmin from "../../utils/supabase.utils.js";

export async function saveEmotionData(emotionData) {
  const { data, error } = await supabaseAdmin
    .from("message_emotion")
    .insert(emotionData);
}
