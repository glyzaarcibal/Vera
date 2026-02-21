import { getEmotionFromAudio } from "../../service/Chat/SpeechToText.service.js";
import { callHumeEmotionModel, mapHumeEmotionsToDb } from "../../service/Chat/SpeechToText.service.js";
import { saveEmotionData } from "../../service/Chat/Emotion.service.js";

/**
 * POST /api/emotion-from-voice
 * Body: { audioBase64, messageId? }
 * Returns: { emotion, score, source: "Hume AI" } so the UI can show the label.
 * If messageId is provided, also saves emotion data to database.
 */
export const emotionFromVoice = async (req, res) => {
  try {
    const { audioBase64, messageId } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({
        emotion: null,
        score: 0,
        source: "Hume AI",
        message: "Missing or invalid audioBase64",
      });
    }

    const result = await getEmotionFromAudio(audioBase64);

    // If messageId is provided, save emotion data to database
    if (messageId && result.emotion) {
      try {
        // Get full emotion scores (not just dominant)
        const humeEmotions = await callHumeEmotionModel(audioBase64);
        const emotionScores = mapHumeEmotionsToDb(humeEmotions);

        await saveEmotionData({
          message_id: messageId,
          ...emotionScores,
          model: "hume-ai-prosody",
        });
        console.log("[emotionFromVoice] Emotion data saved to database for message_id:", messageId);
      } catch (saveError) {
        console.error("[emotionFromVoice] Failed to save emotion data:", saveError);
        // Don't fail the request if save fails
      }
    }

    return res.status(200).json({
      emotion: result.emotion,
      score: result.score ?? 0,
      source: "Hume AI",
      model: "hume-ai-prosody",
      emotions: ["angry", "calm", "disgust", "doubt", "confusion", "fearful", "happy", "neutral", "sad", "surprised"],
      ...(result.error && { error: result.error }),
      ...(messageId && { saved: true }),
    });
  } catch (e) {
    console.error("[emotionFromVoice]", e);
    return res.status(500).json({
      emotion: null,
      score: 0,
      source: "Hume AI",
      error: e.message || "Internal server error",
    });
  }
};
