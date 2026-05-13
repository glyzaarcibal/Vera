import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { ANALYSIS_PROMPT } from "../../config/prompt.config.js";
import supabaseAdmin from "../../utils/supabase.utils.js";
import { sendCriticalRiskAlert } from "../Email.service.js";

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

    // REAL-TIME ALERT SYSTEM: Check for critical risk
    if (analysis.risk_level === "critical") {
      await handleCriticalAlert(sessionId, analysis.risk_score, analysis.summary);
    }

    return {
      summary: analysis.summary,
      risk_level: analysis.risk_level,
      risk_score: analysis.risk_score,
      categories: analysis.categories,
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

async function handleCriticalAlert(sessionId, riskScore, summary) {
  try {
    console.log(`[ALERT] Processing critical risk alert for session: ${sessionId}`);
    
    // 1. Get user_id from session
    const { data: session, error: sessErr } = await supabaseAdmin
      .from("chat_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session?.user_id) return;

    // 2. Get user profile and guardian info
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("username, guardian_email")
      .eq("id", session.user_id)
      .single();

    if (profErr || !profile) return;

    // 3. Send email if guardian_email exists
    if (profile.guardian_email) {
      console.log(`[ALERT] Sending urgent email to guardian: ${profile.guardian_email}`);
      await sendCriticalRiskAlert(
        profile.guardian_email,
        profile.username || "User",
        riskScore,
        summary
      );
    } else {
      console.log(`[ALERT] No guardian email found for user: ${profile.username}`);
    }
  } catch (err) {
    console.error("[ALERT] Failed to send critical risk alert:", err);
  }
}
