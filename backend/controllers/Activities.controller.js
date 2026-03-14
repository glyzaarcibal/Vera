import {
  saveActivityToDB,
  getActivitiesFromDB,
  deleteActivityFromDB,
} from "../service/Activities.service.js";

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

export const deleteActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const { activityId } = req.params;

    if (!activityId) {
      return res.status(400).json({ message: "Activity ID is required." });
    }

    const deletedRows = await deleteActivityFromDB(userId, activityId);
    if (!deletedRows.length) {
      return res.status(404).json({ message: "Activity not found." });
    }

    return res.status(200).json({ message: "Activity deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
