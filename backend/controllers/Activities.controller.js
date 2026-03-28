import { saveActivityToDB, getActivitiesFromDB } from "../service/Activities.service.js";
import { addTokens } from "../service/Auth/Token.service.js";

// Save activity for a user
export const saveActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const { activityType, data } = req.body;
    if (!userId || !activityType || !data) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    await saveActivityToDB(userId, activityType, data);
    
    // Award 1 token for completing an activity
    let updatedTokens = null;
    try {
      updatedTokens = await addTokens(userId, 1, `Completed activity: ${activityType}`);
    } catch (tokenError) {
      console.error("[saveActivity] Failed to award tokens:", tokenError);
      // Don't fail the request if token awarding fails
    }

    res.status(200).json({ 
      message: "Activity saved successfully and 1 token earned!",
      updatedTokens 
    });
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
