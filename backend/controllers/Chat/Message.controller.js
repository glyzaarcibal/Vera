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
    const { message, messages, audioBase64 } = req.body;
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

    const userMessage = {
      session_id: sessionId,
      content: message.text,
      sent_by: "user",
    };

    if (permissions.permit_store) {
      const messageId = await saveMessage(userMessage);
      console.log(messageId.id);
      if (audioBase64 && messageId.id != null) {
        console.log("Audio base64 received, transcribing...");
        transcribeAudio(audioBase64, messageId.id);
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

    return res.status(200).json({ response });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
