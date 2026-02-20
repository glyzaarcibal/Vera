import supabaseAdmin from "../../utils/supabase.utils.js";

/**
 * Saves emotion scores from wav2vec2-lg-xlsr-en-speech-emotion-recognition (8 emotions).
 * Table message_emotion should have columns: message_id, angry, calm, disgust, fearful, happy, neutral, sad, surprised, model.
 * If "calm" is missing, add it: ALTER TABLE message_emotion ADD COLUMN calm NUMERIC DEFAULT 0;
 */
export async function saveEmotionData(emotionData) {
  const { data, error } = await supabaseAdmin
    .from("message_emotion")
    .insert(emotionData);
  if (error) console.error("[Emotion.service] saveEmotionData error:", error.message);
}
