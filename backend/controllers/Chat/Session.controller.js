import {
  createSession,
  fetchMessagesBySessionId,
  fetchSessionsByUserId,
} from "../../service/Chat/Session.service.js";

export const initSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { type } = req.params;
    const { voice } = req.body ?? {};
    const session = await createSession(userId, type, voice);
    return res.status(200).json({ session });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Failed to start Session" });
  }
};

export const getAllSessionsOfByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, type, riskLevels } = req.query;

    // Parse riskLevels from comma-separated string to array
    const parsedRiskLevels = riskLevels ? riskLevels.split(",") : [];

    const result = await fetchSessionsByUserId(userId, {
      page,
      limit,
      type,
      riskLevels: parsedRiskLevels,
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
