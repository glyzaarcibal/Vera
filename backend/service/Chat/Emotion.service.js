import supabaseAdmin from "../../utils/supabase.utils.js";

/**
 * Saves emotion scores (Hume AI Prosody). Columns must exist in message_emotion.
 * Run supabase/migrations/add_doubt_confusion_emotion.sql if PGRST204 occurs.
 */
const MESSAGE_EMOTION_COLUMNS = [
  "message_id",
  "angry",
  "disgust",
  "doubt",
  "confusion",
  "fearful",
  "happy",
  "neutral",
  "sad",
  "surprised",
  "model",
];

export async function saveEmotionData(emotionData) {
  try {
    const row = {};
    for (const key of MESSAGE_EMOTION_COLUMNS) {
      if (emotionData[key] !== undefined) {
        row[key] = emotionData[key];
      }
    }
    const { data, error } = await supabaseAdmin
      .from("message_emotion")
      .insert(row)
      .select();
    
    if (error) {
      console.error("[Emotion.service] saveEmotionData error:", error.message);
      console.error("[Emotion.service] Error details:", error);
      console.error("[Emotion.service] Data attempted:", row);
      throw error;
    }
    
    console.log("[Emotion.service] Successfully saved emotion data for message_id:", row.message_id);
    return data;
  } catch (error) {
    console.error("[Emotion.service] Failed to save emotion data:", error);
    throw error;
  }
}
