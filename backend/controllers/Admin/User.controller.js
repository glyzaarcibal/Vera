import { getAllUsers, getUserInfo } from "../../service/Admin/User.service.js";
import { getAvatarRiskStats } from "../../service/Chat/Session.service.js";

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
