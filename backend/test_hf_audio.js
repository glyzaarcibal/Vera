/**
 * Quick check: does your Hugging Face token work with the audio/emotion endpoint?
 * Run from backend: node test_hf_audio.js
 *
 * - 200 or 400 with a non-403 body => token can reach the endpoint (working).
 * - 403 => token missing "Inference Endpoints" (or similar) permission.
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const HUGGING_FACE_STT_ENDPOINT =
  "https://xgqc71v8577p78la.us-east-1.aws.endpoints.huggingface.cloud";
const token = process.env.HUGGING_FACE_API_TOKEN;

if (!token) {
  console.error("Missing HUGGING_FACE_API_TOKEN in .env");
  process.exit(1);
}

console.log("Token present: yes");
console.log("Calling HF audio endpoint...");

// Minimal base64 (tiny placeholder; endpoint may return 400 for invalid audio)
const minimalBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

axios
  .post(
    HUGGING_FACE_STT_ENDPOINT,
    { inputs: minimalBase64, parameters: {} },
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )
  .then((res) => {
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(res.data, null, 2));
    console.log("\nHugging Face audio endpoint is reachable with this token.");
  })
  .catch((err) => {
    const status = err.response?.status;
    const data = err.response?.data;
    console.log("Status:", status || "network error");
    if (data) console.log("Response:", JSON.stringify(data, null, 2));
    if (status === 403) {
      console.log(
        "\nHugging Face returned 403: add 'Inference Endpoints' (or required scope) to your token at https://huggingface.co/settings/tokens"
      );
    } else {
      console.log("\nRequest reached the server; check response above (e.g. 400 = bad input, not token).");
    }
  });
