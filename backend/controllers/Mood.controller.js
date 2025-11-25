import { checkMoodByUserId, saveDailyMood } from "../service/Mood.service.js";

export const checkIfUserHasEnteredDailyMood = async (req, res) => {
  try {
    const userId = req.userId;
    const moods = await checkMoodByUserId(userId);
    return res.status(200).json({ moods });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createDailyMood = async (req, res) => {
  try {
    const userId = req.userId;
    const { mood_score } = req.body;

    if (!mood_score || mood_score < 1 || mood_score > 5) {
      return res.status(400).json({ message: "Invalid mood score. Must be between 1 and 5." });
    }

    const mood = await saveDailyMood(userId, mood_score);
    return res.status(201).json({ message: "Mood saved successfully", mood });
  } catch (e) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
