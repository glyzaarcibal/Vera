import { fetchPermissions } from "../../service/Auth/Permissions.service.js";
import { analyzeConversation } from "../../service/Chat/Analysis.service.js";
import {
  generateResponse,
  saveMessage,
} from "../../service/Chat/Message.service.js";
import { transcribeAudio } from "../../service/Chat/SpeechToText.service.js";
import { saveEmotionData } from "../../service/Chat/Emotion.service.js";
import { mapHumeEmotionsToDb } from "../../service/Chat/SpeechToText.service.js";

// Number of previous messages to include as context
const CONTEXT_MESSAGE_COUNT = 5;

export const processMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { message, messages = [], audioBase64, systemPrompt } = req.body;
    const permissions = await fetchPermissions(userId);
    console.log("Permission to save:", permissions.permit_store);
    console.log("Permission to analyze:", permissions.permit_analyze);
    // Transcribe audio if audioBase64 is present

    // Build conversation history from the latest X messages
    const conversationHistory = messages
      .slice(-CONTEXT_MESSAGE_COUNT)
      .map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.text,
      }));

    const messageText = message?.text ?? message?.content ?? "";
    const userMessage = {
      session_id: sessionId,
      content: messageText,
      sent_by: "user",
    };

    let savedMessageId = null;
    let voiceEmotion = null;
    if (permissions.permit_store) {
      const messageId = await saveMessage(userMessage);
      savedMessageId = messageId.id;
      console.log("[processMessage] Saved user message with ID:", savedMessageId);
      if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 100 && savedMessageId != null) {
        console.log("[processMessage] Audio base64 received (len=" + audioBase64.length + "), transcribing and detecting emotions...");
        try {
          voiceEmotion = await transcribeAudio(audioBase64, savedMessageId);
          console.log("[processMessage] Emotion detection completed for message:", savedMessageId);
        } catch (err) {
          console.warn("[processMessage] Transcribe/emotion detection failed (non-fatal):", err.message);
        }
      }
    }

    let response;
    let responseWarning = null;
    try {
      response = await generateResponse(
        userMessage.content,
        conversationHistory,
        systemPrompt
      );
    } catch (err) {
      responseWarning = "AI provider temporarily unavailable";
      console.warn("[processMessage] generateResponse failed; returning fallback:", err.message);
      response =
        "I'm having trouble connecting to my response service right now, but I still heard you. Please try again in a moment.";
    }
    const botMessage = {
      ...userMessage,
      content: response,
      sent_by: "bot",
    };
    if (permissions.permit_store) saveMessage(botMessage);

    messages.push(userMessage);
    messages.push(botMessage);
    if (messages.length >= 5 && (permissions?.permit_analyze !== false)) {
      analyzeConversation(messages, sessionId).catch(err => 
        console.error("[processMessage] Background analysis failed:", err)
      );
    }

    return res.status(200).json({ 
      response,
      messageId: savedMessageId, // Return messageId so frontend can use it for additional operations
      voiceEmotion,
      responseWarning
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const saveEviMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { content, role, emotionScores } = req.body;

    if (!content?.trim() || !["user", "assistant"].includes(role)) {
      return res.status(400).json({ message: "Invalid EVI message payload" });
    }

    const permissions = await fetchPermissions(userId);
    if (!permissions.permit_store) {
      return res.status(200).json({ saved: false, reason: "Storage disabled" });
    }

    const savedMessage = await saveMessage({
      session_id: sessionId,
      content: content.trim(),
      sent_by: role === "user" ? "user" : "bot",
    });

    if (
      role === "user" &&
      emotionScores &&
      typeof emotionScores === "object"
    ) {
      try {
        const mappedScores = mapHumeEmotionsToDb(emotionScores);
        await saveEmotionData({
          message_id: savedMessage.id,
          ...mappedScores,
          model: "hume-evi-prosody",
        });
      } catch (emotionError) {
        console.warn(
          "[saveEviMessage] Message saved without emotion data:",
          emotionError.message
        );
      }
    }

    return res.status(201).json({
      saved: true,
      messageId: savedMessage.id,
    });
  } catch (error) {
    console.error("[saveEviMessage]", error);
    return res.status(500).json({
      message: error.message || "Failed to save EVI message",
    });
  }
};
