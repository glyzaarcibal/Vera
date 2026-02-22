import { saveActivityToDB, getActivitiesFromDB } from "../service/Activities.service.js";

// Save activity for a user
export const saveActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const { activityType, data } = req.body;
    if (!userId || !activityType || !data) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    await saveActivityToDB(userId, activityType, data);
    res.status(200).json({ message: "Activity saved successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get activities for a user
export const getActivities = async (req, res) => {
  try {
    const userId = req.userId;
    const activities = await getActivitiesFromDB(userId);
    res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
