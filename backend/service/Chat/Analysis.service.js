import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { ANALYSIS_PROMPT } from "../../config/prompt.config.js";
import supabaseAdmin from "../../utils/supabase.utils.js";

dotenv.config();
const client = new InferenceClient(process.env.HUGGING_FACE_API_TOKEN);

export async function analyzeConversation(conversation, sessionId) {
  console.log("Analyzing Conversation...");
  try {
    const conversationText = conversation
      .map((msg) => {
        const role = msg.sent_by || msg.type || msg.role;
        const content = msg.content || msg.text;
        return `${role}: ${content}`;
      })
      .join("\n\n");

    const messages = [
      {
        role: "system",
        content: ANALYSIS_PROMPT,
      },
      {
        role: "user",
        content: `Please analyze the following conversation:\n\n${conversationText}`,
      },
    ];

    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages,
    });

    const responseText = chatCompletion.choices[0].message.content;
    const analysis = JSON.parse(responseText);
    await updateSession(
      sessionId,
      analysis.summary,
      analysis.risk_level,
      analysis.risk_score
    );

    return {
      summary: analysis.summary,
      risk_level: analysis.risk_level,
      risk_score: analysis.risk_score,
    };
  } catch (error) {
    console.error("Conversation analysis error:", error);
    throw new Error(`Failed to analyze conversation: ${error.message}`);
  }
}

async function updateSession(sessionId, summary, risk_level, risk_score) {
  const { error } = await supabaseAdmin
    .from("chat_sessions")
    .update({ summary, risk_level, risk_score })
    .eq("id", sessionId);

  if (error) throw error;
}
