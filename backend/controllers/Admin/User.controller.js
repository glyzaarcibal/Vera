import { getAllUsers, getUserInfo, detectEmotionWords } from "../../service/Admin/User.service.js";
import { getAvatarRiskStats } from "../../service/Chat/Session.service.js";
import { getActivitiesFromDB } from "../../service/Activities.service.js";

export const fetchAvatarRiskStats = async (req, res) => {
  try {
    const stats = await getAvatarRiskStats();
    return res.status(200).json(stats);
  } catch (e) {
    console.error("Error fetching avatar risk stats:", e);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export const fetchUsers = async (req, res) => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await getAllUsers({ page, limit, search, role, status });
    return res.status(200).json(result);
  } catch (e) {
    console.error("Error fetching users:", e);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};

export const fetchUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await getUserInfo(userId);
    return res.status(200).json({ profile });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserEmotionWords = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await detectEmotionWords(userId);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Error detecting emotion words:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await getActivitiesFromDB(userId);
    return res.status(200).json({ activities });
  } catch (e) {
    console.error("Error fetching user activities:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
