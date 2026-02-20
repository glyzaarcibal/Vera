import axios from "axios";
import dotenv from "dotenv";
import { saveEmotionData } from "./Emotion.service.js";

dotenv.config();

const HUGGING_FACE_STT_ENDPOINT =
  "https://xgqc71v8577p78la.us-east-1.aws.endpoints.huggingface.cloud";

function getHfToken() {
  const t = process.env.HUGGING_FACE_API_TOKEN;
  return typeof t === "string" ? t.trim() : "";
}

export async function transcribeAudio(audioBase64, messageId) {
  try {
    console.log("Transcribing audio...");
    console.log("Audio base64 length:", audioBase64.length);

    const token = getHfToken();
    const response = await axios.post(
      HUGGING_FACE_STT_ENDPOINT,
      {
        inputs: audioBase64,
        parameters: {},
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Transcription response:", response.data);

    // Save emotion data if available
    if (response.data && Array.isArray(response.data) && messageId) {
      const emotionScores = response.data.reduce((acc, item) => {
        acc[item.label] = item.score;
        return acc;
      }, {});

      await saveEmotionData({
        message_id: messageId,
        fearful: emotionScores.fearful || 0,
        angry: emotionScores.angry || 0,
        neutral: emotionScores.neutral || 0,
        happy: emotionScores.happy || 0,
        sad: emotionScores.sad || 0,
        surprised: emotionScores.surprised || 0,
        disgust: emotionScores.disgust || 0,
        model: "huggingface-stt",
      });
    }

    return response.data;
  } catch (error) {
    const data = error.response?.data;
    const status = error.response?.status;
    console.error("Speech-to-text error:", data || error.message);

    if (status === 403 && data?.code === "FORBIDDEN") {
      console.warn(
        "[SpeechToText] Hugging Face 403: Your token may lack 'Inference Endpoints' permission. " +
          "Chat and message saving still work; only audio emotion analysis is skipped. " +
          "See https://huggingface.co/settings/tokens to add the required scope, or use a dedicated Inference Endpoint with the correct access."
      );
      return null;
    }

    // Don't crash the app: log and return null so message flow continues
    console.warn("[SpeechToText] Transcription failed, continuing without emotion-from-audio:", error.message);
    return null;
  }
}

/**
 * Get dominant emotion from audio via Hugging Face (for /emotion-from-voice API).
 * Returns { emotion, score } or null so the frontend can show "Hugging Face: happy" etc.
 */
export async function getEmotionFromAudio(audioBase64) {
  try {
    const token = getHfToken();
    if (!token) {
      console.warn("[SpeechToText] HUGGING_FACE_API_TOKEN missing or empty");
      return {
        emotion: null,
        score: 0,
        error: "Hugging Face token not set. Add HUGGING_FACE_API_TOKEN to backend/.env and restart the server.",
      };
    }

    const response = await axios.post(
      HUGGING_FACE_STT_ENDPOINT,
      { inputs: audioBase64, parameters: {} },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { emotion: null, score: 0, raw: data };
    }

    const sorted = [...data].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const top = sorted[0];
    const emotion = top?.label ?? null;
    const score = typeof top?.score === "number" ? top.score : 0;

    return { emotion, score };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("[SpeechToText] getEmotionFromAudio error:", status, data || error.message);

    if (status === 401) {
      return {
        emotion: null,
        score: 0,
        error:
          "Invalid Hugging Face token (401). In backend/.env set HUGGING_FACE_API_TOKEN to a valid token from https://huggingface.co/settings/tokens — then restart the server.",
      };
    }
    if (status === 403) {
      return {
        emotion: null,
        score: 0,
        error:
          "Hugging Face 403: token needs permission. Go to https://huggingface.co/settings/tokens → edit your token → under User permissions (top) enable 'Make calls to your Inference Endpoints' → Save → create a NEW token, copy it, put in backend/.env as HUGGING_FACE_API_TOKEN=..., restart backend.",
      };
    }

    return {
      emotion: null,
      score: 0,
      error: error.response?.data?.error || error.message || "Hugging Face request failed",
    };
  }
}
