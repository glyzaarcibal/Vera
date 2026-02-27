import { fetchChatSessionsByUserId, fetchAppointmentsByUserId } from "../service/Profile.service.js";

export const retrieveChatSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const chat_sessions = await fetchChatSessionsByUserId(userId);
    return res.status(200).json({ chat_sessions });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const retrieveAppointments = async (req, res) => {
  try {
    const userId = req.userId;
    const appointments = await fetchAppointmentsByUserId(userId);
    return res.status(200).json({ appointments });
  } catch (e) {
    console.error("Error fetching appointments:", e.message);
    console.error("Full error:", e);
    return res.status(500).json({ message: "Internal Server Error", error: e.message });
  }
};
