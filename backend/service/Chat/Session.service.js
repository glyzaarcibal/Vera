import supabaseAdmin from "../../utils/supabase.utils.js";
import { analyzeConversation } from "./Analysis.service.js";

export async function createSession(user_id, type, voice) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .upsert({ user_id, type })
    .select()
    .single();
  console.log(error);
  if (error) throw error;
  return data;
}

export async function fetchSessionInfoById(sessionId) {
  const { data, error } = await supabaseAdmin
    .from("chat_sessions")
    .select("*, doctor_notes(*, profiles(id, first_name, last_name))")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSessionAnalysis(sessionId) {
  try {
    // Fetch all messages for this session
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    if (!messages || messages.length === 0) {
      throw new Error("No messages found for this session");
    }

    // Analyze the conversation
    const analysis = await analyzeConversation(messages);

    // Update the session with analysis results
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from("chat_sessions")
      .update({
        summary: analysis.summary,
        risk_level: analysis.risk_level,
        risk_score: analysis.risk_score,
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedSession;
  } catch (error) {
    console.error("Session analysis update error:", error);
    throw new Error(`Failed to update session analysis: ${error.message}`);
  }
}

export async function fetchSessionsByUserId(userId, params = {}) {
  const { page = 1, limit = 10, type = "all", riskLevels = [] } = params;

  // Build the query
  let query = supabaseAdmin
    .from("chat_sessions")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  // Apply type filter
  if (type !== "all") {
    query = query.eq("type", type);
  }

  // Apply risk level filter
  if (riskLevels.length > 0) {
    query = query.in("risk_level", riskLevels);
  }

  // Execute query with pagination
  const offset = (page - 1) * limit;
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch message count for each session
  const sessionsWithCounts = await Promise.all(
    data.map(async (session) => ({
      ...session,
      messageCount: await fetchMessagesLengthBySession(session.id),
    }))
  );

  // Calculate pagination info
  const totalPages = Math.ceil(count / limit);

  return {
    sessions: sessionsWithCounts,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalSessions: count,
      limit: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function fetchMessagesLengthBySession(sessionId) {
  const { count, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) throw error;
  return count;
}

export async function fetchMessagesBySessionId(sessionId) {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*, message_emotion(*)")
    .eq("session_id", sessionId);
  if (error) throw error;
  const sessionInfo = await fetchSessionInfoById(sessionId);
  return { data, sessionInfo };
}
