import axios from "axios";
import dotenv from "dotenv";
import { saveEmotionData } from "./Emotion.service.js";

dotenv.config();

// Hume AI Expression Measurement API for speech emotion recognition
const HUME_API_URL = "https://api.hume.ai/v0/stream/models";

function getHumeApiKey() {
  const key = process.env.HUME_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

/** Map Hume AI emotions to our database format. Hume provides 48+ dimensions; we map common ones. */
export function mapHumeEmotionsToDb(humeEmotions) {
  const mapped = {
    angry: 0,
    calm: 0,
    disgust: 0,
    doubt: 0,
    confusion: 0,
    fearful: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprised: 0,
  };

  if (!humeEmotions || typeof humeEmotions !== "object") return mapped;

  // Map Hume AI emotion names to our database fields (Hume uses various names e.g. Anger, Happiness)
  const emotionMap = {
    anger: "angry",
    angry: "angry",
    calm: "calm",
    calmness: "calm",
    disgust: "disgust",
    doubt: "doubt",
    doubtful: "doubt",
    uncertainty: "doubt",
    uncertain: "doubt",
    confusion: "confusion",
    confused: "confusion",
    perplexed: "confusion",
    bewildered: "confusion",
    puzzled: "confusion",
    fear: "fearful",
    fearful: "fearful",
    happiness: "happy",
    happy: "happy",
    joy: "happy",
    interest: "happy",
    interested: "happy",
    excitement: "surprised",
    excited: "surprised",
    neutral: "neutral",
    sadness: "sad",
    sad: "sad",
    surprise: "surprised",
    surprised: "surprised",
    Calmness:"neutral",
  };

  Object.entries(humeEmotions).forEach(([key, value]) => {
    const normalizedKey = (key || "").toLowerCase().trim();
    const dbKey = emotionMap[normalizedKey];
    if (dbKey && typeof value === "number") {
      mapped[dbKey] = Math.max(mapped[dbKey] || 0, value);
    }
  });

  return mapped;
}

/** Map raw Hume labels to user-friendly display labels (e.g. Interest -> Happy) */
const RAW_TO_DISPLAY_LABEL = {
  interest: "happy",
  interested: "happy",
  excitement: "surprised",
  excited: "surprised",
};

/** Get dominant emotion from Hume AI response. Returns { label, score }. */
function getDominantEmotion(humeEmotions) {
  if (!humeEmotions || typeof humeEmotions !== "object") return null;

  let maxScore = 0;
  let dominantLabel = null;

  Object.entries(humeEmotions).forEach(([label, score]) => {
    if (typeof score === "number" && score > maxScore) {
      maxScore = score;
      dominantLabel = label;
    }
  });

  if (!dominantLabel) return null;
  const displayLabel = RAW_TO_DISPLAY_LABEL[dominantLabel.toLowerCase()] ?? dominantLabel;
  return { label: displayLabel, score: maxScore };
}

/** Call Hume AI Expression Measurement API for speech emotion recognition. */
export async function callHumeEmotionModel(audioBase64) {
  const apiKey = getHumeApiKey();
  if (!apiKey) {
    throw new Error("HUME_API_KEY not set in backend/.env");
  }

  const audioBuffer = Buffer.from(audioBase64, "base64");

  // Use FormData for multipart upload
  const formDataModule = await import("form-data");
  const FormData = formDataModule.default || formDataModule;
  const formData = new FormData();
  formData.append("file", audioBuffer, {
    filename: "audio.webm",
    contentType: "audio/webm",
  });
  formData.append(
    "json",
    JSON.stringify({
      models: {
        prosody: {}, // Speech Prosody model for emotion from speech
      },
    })
  );

  // Submit batch job
  const uploadResponse = await axios.post(
    "https://api.hume.ai/v0/batch/jobs",
    formData,
    {
      headers: {
        "X-Hume-Api-Key": apiKey,
        ...formData.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );

  const jobId = uploadResponse.data.job_id;
  if (!jobId) {
    throw new Error("Failed to create Hume AI job");
  }

  // Poll job details until COMPLETED (predictions endpoint returns 400 until job is done)
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds
  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const jobResponse = await axios.get(
        `https://api.hume.ai/v0/batch/jobs/${jobId}`,
        {
          headers: {
            "X-Hume-Api-Key": apiKey,
          },
        }
      );

      const status = jobResponse.data?.state?.status;
      if (status === "FAILED") {
        const msg = jobResponse.data?.state?.message || "Job failed";
        throw new Error(`Hume AI job failed: ${msg}`);
      }
      if (status === "COMPLETED") {
        break;
      }
      // QUEUED or IN_PROGRESS: keep polling
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error("Hume AI job not found");
      }
      if (err.message?.includes("Hume AI job failed")) {
        throw err;
      }
      console.warn("[Hume AI] Job status poll error:", err.message);
    }

    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Hume AI job timed out");
  }

  // Job completed: fetch predictions
  const predictionsResponse = await axios.get(
    `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
    {
      headers: {
        "X-Hume-Api-Key": apiKey,
      },
    }
  );

  const data = predictionsResponse.data;
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  // Parse: array of { source, results: { predictions: [ { file, models: { prosody: { grouped_predictions: [ { predictions: [ { emotions: [ { name, score } ] } ] } ] } } } ] } }
  const aggregated = {};
  for (const item of data) {
    const predictions = item?.results?.predictions;
    if (!Array.isArray(predictions)) continue;
    for (const pred of predictions) {
      const prosody = pred?.models?.prosody;
      if (!prosody?.grouped_predictions) continue;
      for (const group of prosody.grouped_predictions) {
        const groupPreds = group?.predictions;
        if (!Array.isArray(groupPreds)) continue;
        for (const p of groupPreds) {
          const emotions = p?.emotions;
          if (!Array.isArray(emotions)) continue;
          for (const e of emotions) {
            const name = e?.name;
            const score = e?.score;
            if (name != null && typeof score === "number") {
              aggregated[name] = Math.max(aggregated[name] ?? 0, score);
            }
          }
        }
      }
    }
  }

  return aggregated;
}

export async function transcribeAudio(audioBase64, messageId) {
  try {
    console.log("[SpeechToText] Emotion from audio (Hume AI)...");
    const apiKey = getHumeApiKey();
    if (!apiKey) {
      console.warn("[SpeechToText] HUME_API_KEY missing in backend/.env. Add HUME_API_KEY=your_key and restart the server.");
      return null;
    }

    const humeEmotions = await callHumeEmotionModel(audioBase64);
    const emotionScores = mapHumeEmotionsToDb(humeEmotions);

    console.log("[SpeechToText] Mapped emotion scores:", emotionScores);
    console.log("[SpeechToText] Message ID for emotion save:", messageId);

    if (messageId) {
      try {
        await saveEmotionData({
          message_id: messageId,
          ...emotionScores,
          model: "hume-ai-prosody",
        });
        console.log("[SpeechToText] Emotion data saved successfully for message:", messageId);
      } catch (saveError) {
        console.error("[SpeechToText] Failed to save emotion data:", saveError);
        // Don't throw - this is non-fatal, emotion detection still worked
      }
    } else {
      console.warn("[SpeechToText] No messageId provided, skipping emotion save");
    }

    // Return array format for compatibility
    return Object.entries(humeEmotions).map(([label, score]) => ({
      label,
      score: typeof score === "number" ? score : 0,
    }));
  } catch (error) {
    const data = error.response?.data;
    const status = error.response?.status;
    console.error("[SpeechToText] Emotion error:", data || error.message);

    console.warn("[SpeechToText] Emotion failed (non-fatal):", error.message);
    return null;
  }
}

/**
 * Get dominant emotion from audio via Hume AI Expression Measurement API.
 * Uses Speech Prosody model for emotion detection from speech.
 * For /emotion-from-voice API; returns { emotion, score } so frontend can show "Hume AI: happy" etc.
 */
export async function getEmotionFromAudio(audioBase64) {
  try {
    const apiKey = getHumeApiKey();
    if (!apiKey) {
      return {
        emotion: null,
        score: 0,
        error: "Hume AI API key not set. Add HUME_API_KEY to backend/.env and restart the server.",
      };
    }

    const humeEmotions = await callHumeEmotionModel(audioBase64);
    const dominant = getDominantEmotion(humeEmotions);

    if (!dominant) {
      return { emotion: null, score: 0 };
    }

    return { emotion: dominant.label, score: dominant.score };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("[SpeechToText] getEmotionFromAudio error:", status, data || error.message);

    if (status === 401) {
      return {
        emotion: null,
        score: 0,
        error:
          "Invalid Hume AI API key (401). Set HUME_API_KEY in backend/.env (get key from https://platform.hume.ai/), then restart the server.",
      };
    }

    return {
      emotion: null,
      score: 0,
      error: error.response?.data?.error || error.message || "Hume AI request failed",
    };
  }
}
