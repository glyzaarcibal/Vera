import { fetchPermissions } from "../../service/Auth/Permissions.service.js";
import { analyzeConversation } from "../../service/Chat/Analysis.service.js";
import {
  generateResponse,
  saveMessage,
} from "../../service/Chat/Message.service.js";
import { transcribeAudio } from "../../service/Chat/SpeechToText.service.js";

// Number of previous messages to include as context
const CONTEXT_MESSAGE_COUNT = 5;

export const processMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { message, messages = [], audioBase64 } = req.body;
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
    if (permissions.permit_store) {
      const messageId = await saveMessage(userMessage);
      savedMessageId = messageId.id;
      console.log("[processMessage] Saved user message with ID:", savedMessageId);
      if (audioBase64 && typeof audioBase64 === "string" && audioBase64.length > 100 && savedMessageId != null) {
        console.log("[processMessage] Audio base64 received (len=" + audioBase64.length + "), transcribing and detecting emotions...");
        try {
          await transcribeAudio(audioBase64, savedMessageId);
          console.log("[processMessage] Emotion detection completed for message:", savedMessageId);
        } catch (err) {
          console.warn("[processMessage] Transcribe/emotion detection failed (non-fatal):", err.message);
        }
      }
    }

    const response = await generateResponse(
      userMessage.content,
      conversationHistory
    );
    const botMessage = {
      ...userMessage,
      content: response,
      sent_by: "bot",
    };
    if (permissions.permit_store) saveMessage(botMessage);

    messages.push(userMessage);
    messages.push(botMessage);
    if (messages.length > 5 && permissions.permit_analyze)
      analyzeConversation(messages, sessionId);

    return res.status(200).json({ 
      response,
      messageId: savedMessageId // Return messageId so frontend can use it for additional operations
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
