import {
  createSession,
  fetchMessagesBySessionId,
  fetchSessionInfoById,
  fetchSessionsByUserId,
  updateSessionAnalysis,
} from "../../service/Chat/Session.service.js";
import { deductToken } from "../../service/Auth/Token.service.js";
import { fetchPermissions } from "../../service/Auth/Permissions.service.js";

export const initSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.params;
    const { voice, avatar } = req.body ?? {};

    // Deduct token for AI Voice/Avatar sessions
    let updatedTokens = null;
    const amount = type === "Avatar" ? 3 : type === "voice" ? 2 : 0;
    
    if (amount > 0) {
      try {
        updatedTokens = await deductToken(userId, `${type} Session Started`, amount);
      } catch (tokenError) {
        return res.status(403).json({ 
          message: tokenError.message,
          insufficientTokens: true 
        });
      }
    }

    const sessionMeta = voice
      ? {
          companionKind: "voice",
          voiceName: voice.name,
          voiceId: voice.id,
          gender: voice.gender,
        }
      : avatar
        ? {
            companionKind: avatar.type && ["cat", "dog", "monkey", "panda"].includes(avatar.type)
              ? "animal"
              : "avatar",
            selectedAgent: avatar.type,
            agentName: avatar.label,
            companionName: avatar.label,
            animalType: avatar.type,
            language: avatar.language,
            outfit: avatar.outfit,
          }
        : null;

    const session = await createSession(userId, type, sessionMeta);
    return res.status(200).json({ session, updatedTokens });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Failed to start Session" });
  }
};

export const getAllSessionsOfByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, type, riskLevels, sortBy, sortOrder } = req.query;
    
    // Parse riskLevels from comma-separated string to array
    const parsedRiskLevels = riskLevels ? riskLevels.split(",") : [];

    const result = await fetchSessionsByUserId(userId, {
      page,
      limit,
      type,
      riskLevels: parsedRiskLevels,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(result);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { data: chat, sessionInfo } = await fetchMessagesBySessionId(
      sessionId
    );
    return res.status(200).json({ chat, sessionInfo });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const analyzeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await fetchSessionInfoById(sessionId);

    if (session.user_id !== req.userId) {
      return res.status(403).json({ message: "Not allowed to analyze this session" });
    }

    const permissions = await fetchPermissions(req.userId);
    if (permissions.permit_analyze === false) {
      return res.status(200).json({
        analyzed: false,
        reason: "Analysis disabled in privacy settings",
      });
    }

    const updatedSession = await updateSessionAnalysis(sessionId);
    return res.status(200).json({
      analyzed: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("[analyzeSession]", error);
    return res.status(500).json({
      message: error.message || "Failed to analyze session",
    });
  }
};
