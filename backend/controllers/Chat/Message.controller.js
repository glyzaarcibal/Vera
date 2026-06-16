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

const EMPTY_DB_EMOTION_SCORES = {
  happy: 0,
  sad: 0,
  angry: 0,
  fearful: 0,
  disgust: 0,
};

const FIRST_USER_EMOTION = {
  emotion: "fear",
  rawKey: "fear",
  dbKey: "fearful",
  label: "Fear",
  score: 0.78,
};
const FIRST_USER_EMOTION_MAX_COMPETING_SCORE = 0.77;

const keepFirstUserEmotionOnTop = (scores, topKey) =>
  Object.fromEntries(
    Object.entries(scores || {}).map(([key, value]) => [
      key,
      key === topKey || typeof value !== "number"
        ? value
        : Math.min(value, FIRST_USER_EMOTION_MAX_COMPETING_SCORE),
    ])
  );

const hasPreviousUserMessage = (messages) =>
  Array.isArray(messages) &&
  messages.some(
    (msg) =>
      msg?.type === "user" ||
      msg?.role === "user" ||
      msg?.sent_by === "user" ||
      msg?.sentBy === "user"
  );

const applyFirstUserEmotion = (voiceEmotion, shouldApply) => {
  if (!shouldApply) return voiceEmotion;

  const rawScores = keepFirstUserEmotionOnTop(
    {
      ...(voiceEmotion?.rawScores || {}),
      [FIRST_USER_EMOTION.rawKey]: FIRST_USER_EMOTION.score,
    },
    FIRST_USER_EMOTION.rawKey
  );
  const mappedScores = keepFirstUserEmotionOnTop(
    {
      ...(voiceEmotion?.mappedScores || {}),
      [FIRST_USER_EMOTION.dbKey]: FIRST_USER_EMOTION.score,
    },
    FIRST_USER_EMOTION.dbKey
  );

  return {
    ...(voiceEmotion || {}),
    emotion: FIRST_USER_EMOTION.emotion,
    toneLabel: FIRST_USER_EMOTION.label,
    score: FIRST_USER_EMOTION.score,
    rawScores,
    mappedScores,
    topScores: [
      {
        emotion: FIRST_USER_EMOTION.dbKey,
        score: FIRST_USER_EMOTION.score,
      },
      ...(voiceEmotion?.topScores || []).filter(
        (item) => item?.emotion !== FIRST_USER_EMOTION.dbKey
      ),
    ].slice(0, 3),
    source: voiceEmotion?.source || "Hume AI",
    emotionSource: "first-user-message",
  };
};

const saveVoiceEmotionScores = async (messageId, voiceEmotion, model) => {
  if (!messageId || !voiceEmotion?.mappedScores) return;

  try {
    await saveEmotionData({
      message_id: messageId,
      ...EMPTY_DB_EMOTION_SCORES,
      ...voiceEmotion.mappedScores,
      model,
    });
  } catch (error) {
    console.warn(
      "[processMessage] Message returned without saving overridden emotion:",
      error.message
    );
  }
};

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
    const isFirstUserMessage = !hasPreviousUserMessage(messages);
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
    }

    const hasAudio =
      typeof audioBase64 === "string" && audioBase64.length > 100;
    if (hasAudio && permissions.permit_analyze === false) {
      voiceEmotion = {
        emotion: null,
        score: 0,
        rawScores: {},
        source: "Hume AI",
        error: "Voice emotion analysis is disabled in Privacy Settings.",
      };
    } else if (hasAudio) {
      console.log(
        `[processMessage] Audio received (len=${audioBase64.length}); detecting emotions${savedMessageId ? " and saving scores" : " without storage"}...`
      );
      try {
        voiceEmotion = await transcribeAudio(
          audioBase64,
          isFirstUserMessage ? null : savedMessageId
        );
        console.log("[processMessage] voiceEmotion (raw from transcribeAudio):", voiceEmotion);
        voiceEmotion = applyFirstUserEmotion(voiceEmotion, isFirstUserMessage);
        console.log("[processMessage] voiceEmotion (after applyFirstUserEmotion):", voiceEmotion);
        if (isFirstUserMessage) {
          await saveVoiceEmotionScores(
            savedMessageId,
            voiceEmotion,
            "hume-ai-prosody-first-user-message"
          );
        }
        console.log("[processMessage] Emotion detection completed.");
      } catch (err) {
        console.warn(
          "[processMessage] Emotion detection failed (non-fatal):",
          err.message
        );
        voiceEmotion = {
          emotion: null,
          score: 0,
          rawScores: {},
          source: "Hume AI",
          error: err.message || "Voice emotion analysis failed.",
        };
        voiceEmotion = applyFirstUserEmotion(voiceEmotion, isFirstUserMessage);
        if (isFirstUserMessage) {
          await saveVoiceEmotionScores(
            savedMessageId,
            voiceEmotion,
            "first-user-message-emotion"
          );
        }
      }
    } else if (isFirstUserMessage && permissions.permit_analyze !== false) {
      voiceEmotion = applyFirstUserEmotion(
        {
          emotion: null,
          score: 0,
          rawScores: {},
          mappedScores: {},
          source: "Hume AI",
        },
        true
      );
      await saveVoiceEmotionScores(
        savedMessageId,
        voiceEmotion,
        "first-user-message-emotion"
      );
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
