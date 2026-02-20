import { getEmotionFromAudio } from "../../service/Chat/SpeechToText.service.js";

/**
 * POST /api/emotion-from-voice
 * Body: { audioBase64 }
 * Returns: { emotion, score, source: "Hume AI" } so the UI can show the label.
 */
export const emotionFromVoice = async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({
        emotion: null,
        score: 0,
        source: "Hume AI",
        message: "Missing or invalid audioBase64",
      });
    }

    const result = await getEmotionFromAudio(audioBase64);

    return res.status(200).json({
      emotion: result.emotion,
      score: result.score ?? 0,
      source: "Hume AI",
      model: "hume-ai-prosody",
      emotions: ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
      ...(result.error && { error: result.error }),
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
