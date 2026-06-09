import axios from "axios";
import FormData from "form-data";

const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";

function getElevenLabsApiKey() {
  const key = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

function getElevenLabsError(error) {
  const data = error.response?.data;

  if (Buffer.isBuffer(data)) {
    try {
      const text = data.toString("utf8");
      const parsed = JSON.parse(text);
      return (
        parsed?.detail?.message ||
        parsed?.message ||
        parsed?.error ||
        text
      );
    } catch (_) {
      return error.message || "ElevenLabs request failed";
    }
  }

  return (
    data?.detail?.message ||
    data?.message ||
    data?.error ||
    error.message ||
    "ElevenLabs request failed"
  );
}

function getClientStatusForElevenLabsError(status) {
  if (status === 401 || status === 403) return 502;
  return status || 500;
}

function getClientMessageForElevenLabsError(error) {
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    return "ElevenLabs API key was rejected. Regenerate the key, update backend/.env, then restart the backend server.";
  }
  if (status === 402) {
    return "ElevenLabs returned Payment Required. The API key is being used, but the ElevenLabs account/key does not currently have available text-to-speech quota or billing access.";
  }
  return getElevenLabsError(error);
}

export async function speechToText(req, res) {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return res.status(500).json({
      message: "ElevenLabs API key is not configured on the backend.",
    });
  }

  if (!req.file?.buffer) {
    return res.status(400).json({ message: "Audio file is required." });
  }

  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname || "audio.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    formData.append("model_id", req.body?.model_id || "scribe_v2");

    const response = await axios.post(
      `${ELEVENLABS_API_BASE_URL}/speech-to-text`,
      formData,
      {
        headers: {
          "xi-api-key": apiKey,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 90000,
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[ElevenLabs.speechToText]", status, getElevenLabsError(error));
    return res
      .status(getClientStatusForElevenLabsError(status))
      .json({ message: getClientMessageForElevenLabsError(error) });
  }
}

export async function textToSpeech(req, res) {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return res.status(500).json({
      message: "ElevenLabs API key is not configured on the backend.",
    });
  }

  const { voiceId } = req.params;
  const {
    text,
    model_id = "eleven_multilingual_v2",
    voice_settings,
  } = req.body || {};
  if (!voiceId || !text) {
    return res.status(400).json({ message: "voiceId and text are required." });
  }

  try {
    const outputFormat = req.query.output_format || "mp3_44100_128";
    const response = await axios.post(
      `${ELEVENLABS_API_BASE_URL}/text-to-speech/${encodeURIComponent(voiceId)}`,
      { text, model_id, voice_settings },
      {
        params: { output_format: outputFormat },
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 90000,
      }
    );

    res.setHeader("Content-Type", response.headers["content-type"] || "audio/mpeg");
    return res.status(200).send(Buffer.from(response.data));
  } catch (error) {
    const status = error.response?.status || 500;
    console.error("[ElevenLabs.textToSpeech]", status, getElevenLabsError(error));
    return res
      .status(getClientStatusForElevenLabsError(status))
      .json({ message: getClientMessageForElevenLabsError(error) });
  }
}
