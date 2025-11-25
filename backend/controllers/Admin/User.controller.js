import { getAllUsers, getUserInfo } from "../../service/Admin/User.service.js";

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
