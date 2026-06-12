const EMOTION_HIERARCHY = {
  admiration: ["Happy", "Accepted"],
  adoration: ["Happy", "Loving"],
  aestheticappreciation: ["Happy", "Inspired"],
  amusement: ["Happy", "Playful"],
  anger: ["Angry", "Mad"],
  anxiety: ["Fearful", "Anxious"],
  awe: ["Surprised", "Amazed"],
  awkwardness: ["Bad", "Uncomfortable"],
  boredom: ["Bad", "Bored"],
  calmness: ["Happy", "Peaceful"],
  concentration: ["Happy", "Focused"],
  confusion: ["Surprised", "Confused"],
  contemplation: ["Happy", "Thoughtful"],
  contempt: ["Disgusted", "Disapproving"],
  contentment: ["Happy", "Content"],
  craving: ["Bad", "Needy"],
  desire: ["Happy", "Hopeful"],
  determination: ["Happy", "Powerful"],
  disappointment: ["Sad", "Disappointed"],
  disgust: ["Disgusted", "Repelled"],
  distress: ["Bad", "Stressed"],
  doubt: ["Fearful", "Insecure"],
  ecstasy: ["Happy", "Joyful"],
  embarrassment: ["Sad", "Ashamed"],
  empathicpain: ["Sad", "Hurt"],
  entrancement: ["Happy", "Interested"],
  envy: ["Angry", "Bitter"],
  excitement: ["Surprised", "Excited"],
  fear: ["Fearful", "Scared"],
  guilt: ["Sad", "Guilty"],
  horror: ["Fearful", "Threatened"],
  interest: ["Happy", "Interested"],
  joy: ["Happy", "Joyful"],
  love: ["Happy", "Loving"],
  nostalgia: ["Sad", "Longing"],
  pain: ["Sad", "Hurt"],
  pride: ["Happy", "Proud"],
  realization: ["Surprised", "Amazed"],
  relief: ["Happy", "Peaceful"],
  romance: ["Happy", "Loving"],
  sadness: ["Sad", "Depressed"],
  satisfaction: ["Happy", "Content"],
  shame: ["Sad", "Ashamed"],
  surprisenegative: ["Surprised", "Startled"],
  surprisepositive: ["Surprised", "Amazed"],
  sympathy: ["Happy", "Caring"],
  tiredness: ["Bad", "Tired"],
  triumph: ["Happy", "Proud"],
};

export const formatEmotionName = (name) =>
  String(name || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeEmotionKey = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export const getEmotionHierarchy = (emotion) => {
  const [primary = "Bad", secondary = "Uncertain"] =
    EMOTION_HIERARCHY[normalizeEmotionKey(emotion)] || [];

  return {
    primary,
    secondary,
    detected: formatEmotionName(emotion),
  };
};

export const getDominantEmotionState = (scores) => {
  const dominantEntry = Object.entries(scores || {})
    .filter(([, score]) => Number.isFinite(score))
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)[0];

  if (!dominantEntry) return null;

  const [emotion, score] = dominantEntry;
  return {
    ...getEmotionHierarchy(emotion),
    emotion,
    score,
  };
};
