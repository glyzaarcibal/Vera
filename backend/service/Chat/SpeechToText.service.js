import axios from "axios";
import dotenv from "dotenv";
import { saveEmotionData } from "./Emotion.service.js";

dotenv.config();

const HUGGING_FACE_STT_ENDPOINT =
  "https://xgqc71v8577p78la.us-east-1.aws.endpoints.huggingface.cloud";
const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

export async function transcribeAudio(audioBase64, messageId) {
  try {
    console.log("Transcribing audio...");
    console.log("Audio base64 length:", audioBase64.length);

    const response = await axios.post(
      HUGGING_FACE_STT_ENDPOINT,
      {
        inputs: audioBase64,
        parameters: {},
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
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
    console.error(
      "Speech-to-text error:",
      error.response?.data || error.message
    );
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}
