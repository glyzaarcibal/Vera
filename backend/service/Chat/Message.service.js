import supabaseAdmin from "../../utils/supabase.utils.js";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { PROMPT } from "../../config/prompt.config.js";

dotenv.config();
const client = new InferenceClient(process.env.HUGGING_FACE_API_TOKEN);

const MODELS = [
  "meta-llama/Llama-3.1-8B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.2",
  "google/gemma-7b-it"
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateResponse(message, conversationHistory = []) {
  const messages = [
    {
      role: "system",
      content: PROMPT,
    },
    ...conversationHistory,
    {
      role: "user",
      content: message,
    },
  ];

  let lastError = null;
  
  // Try different models if one fails
  for (const model of MODELS) {
    // Retry each model up to 2 times
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[generateResponse] Attempting ${model} (Attempt ${attempt + 1})...`);
        const chatCompletion = await client.chatCompletion({
          model: model,
          messages,
          provider: "hf-inference",
        });

        if (chatCompletion?.choices?.[0]?.message?.content) {
          return chatCompletion.choices[0].message.content;
        }
      } catch (error) {
        lastError = error;
        console.warn(`[generateResponse] Error with ${model}:`, error.message);
        
        // If it's a timeout or rate limit, wait a bit before retrying or switching
        if (error.message.includes("timeout") || error.message.includes("429")) {
          await sleep(1000 * (attempt + 1));
        } else {
          // If it's a different error, maybe just switch model immediately
          break; 
        }
      }
    }
  }

  throw new Error(`Failed to generate response after multiple attempts: ${lastError?.message || "Unknown error"}`);
}

export async function saveMessage(message) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .upsert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}
