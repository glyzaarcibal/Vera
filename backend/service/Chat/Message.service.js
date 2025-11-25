import supabaseAdmin from "../../utils/supabase.utils.js";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { PROMPT } from "../../config/prompt.config.js";

dotenv.config();
const client = new InferenceClient(process.env.HUGGING_FACE_API_TOKEN);

export async function generateResponse(message, conversationHistory = []) {
  try {
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

    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("Hugging Face API error:", error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
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
