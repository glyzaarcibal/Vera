import { getEmotionFromAudio } from "../../service/Chat/SpeechToText.service.js";

/**
 * POST /api/emotion-from-voice
 * Body: { audioBase64 }
 * Returns: { emotion, score, source: "Hugging Face" } so the UI can show the label.
 */
export const emotionFromVoice = async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({
        emotion: null,
        score: 0,
        source: "Hugging Face",
        message: "Missing or invalid audioBase64",
      });
    }

    const result = await getEmotionFromAudio(audioBase64);

    return res.status(200).json({
      emotion: result.emotion,
      score: result.score ?? 0,
      source: "Hugging Face",
      ...(result.error && { error: result.error }),
    });
  } catch (e) {
    console.error("[emotionFromVoice]", e);
    return res.status(500).json({
      emotion: null,
      score: 0,
      source: "Hugging Face",
      error: e.message || "Internal server error",
    });
  }
};
