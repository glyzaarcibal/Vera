import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";
import { ANALYSIS_PROMPT } from "../../config/prompt.config.js";
import supabaseAdmin from "../../utils/supabase.utils.js";
import { sendCriticalRiskAlert } from "../Email.service.js";

dotenv.config();
const client = new InferenceClient(process.env.HUGGING_FACE_API_TOKEN);

export async function analyzeConversation(conversation, sessionId) {
  console.log(`[analyzeConversation] Starting analysis for session ${sessionId}...`);
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
        content: `Analyze this conversation and provide risk assessment:\n\n${conversationText}`,
      },
    ];

    const models = [
      "meta-llama/Llama-3.1-70B-Instruct",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "meta-llama/Llama-3.1-8B-Instruct"
    ];

    let analysis = null;
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[analyzeConversation] Attempting with model: ${model}`);
        const chatCompletion = await client.chatCompletion({
          model: model,
          messages,
          max_tokens: 800,
        });

        let responseText = chatCompletion.choices[0].message.content;
        console.log(`[analyzeConversation] Raw Response from ${model}:`, responseText);

        // More robust JSON extraction
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
          console.log(`[analyzeConversation] Successfully parsed JSON from ${model}`);
          break;
        }
      } catch (err) {
        console.warn(`[analyzeConversation] Model ${model} failed:`, err.message);
        lastError = err;
      }
    }

    if (!analysis) {
      throw new Error(`All analysis models failed. Last error: ${lastError?.message}`);
    }

    console.log(`[analyzeConversation] Analysis Result:`, analysis);

    await updateSession(
      sessionId,
      analysis.summary,
      analysis.risk_level,
      analysis.risk_score
    );

    const normalizedRiskLevel = analysis.risk_level?.toLowerCase();
    
    if (normalizedRiskLevel === "critical") {
      console.log(`[analyzeConversation] Critical risk detected! Triggering alert for session ${sessionId}...`);
      await handleCriticalAlert(sessionId, analysis.risk_score, analysis.summary);
    }

    return analysis;
  } catch (error) {
    console.error("[analyzeConversation] Fatal error:", error);
    // Even on error, we try to mark it as failed in DB so we don't keep "Not Assessed" forever
    try {
      await supabaseAdmin.from("chat_sessions").update({ risk_level: "error" }).eq("id", sessionId);
    } catch (_) {}
    throw error;
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

    if (sessErr || !session?.user_id) {
      console.warn(`[ALERT] Failed to get session or user_id for session ${sessionId}:`, sessErr);
      return;
    }

    // 2. Get user profile and contact info for alerts
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("username, guardian_email")
      .eq("id", session.user_id)
      .single();

    if (profErr || !profile) {
      console.warn(`[ALERT] Failed to get profile for user ${session.user_id}:`, profErr);
      return;
    }

    // Fetch all psychology staff
    const { data: psychStaff, error: psychErr } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name")
      .eq("role", "psychology");

    if (psychErr) {
      console.warn("[ALERT] Failed to fetch psychology staff:", psychErr);
    }

    // 3. Send email to guardian if guardian_email exists
    if (profile.guardian_email) {
      console.log(`[ALERT] Sending urgent email to guardian: ${profile.guardian_email}`);
      await sendCriticalRiskAlert(
        profile.guardian_email,
        profile.username || "User",
        riskScore,
        summary
      );
    } else {
      console.log(`[ALERT] No guardian_email found for user ${profile.username}`);
    }

    // 4. Send email to all psychology staff
    if (psychStaff && psychStaff.length > 0) {
      console.log(`[ALERT] Sending urgent email to ${psychStaff.length} psychology staff member(s).`);
      for (const staff of psychStaff) {
        if (staff.email) {
          await sendCriticalRiskAlert(
            staff.email,
            profile.username || "User",
            riskScore,
            summary
          );
        }
      }
    } else {
      console.log(`[ALERT] No psychology staff found to receive critical alert.`);
    }
    
    console.log(`[ALERT] Finished processing alerts for session ${sessionId}`);
  } catch (err) {
    console.error(`[ALERT] Error in handleCriticalAlert for session ${sessionId}:`, err);
  }
}
