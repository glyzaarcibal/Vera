import React from "react";
import { useNavigate } from "react-router-dom";
import "./Activities.css";

const Activities = () => {
  const navigate = useNavigate();

  const activities = [
    {
      id: 1,
      name: "Clipcard Game",
      description: "Test your memory with matching cards",
      icon: "🎮",
      path: "/activities/clipcard",
    },
    {
      id: 2,
      name: "Diary",
      description: "Write and track your daily thoughts",
      icon: "📔",
      path: "/activities/diary",
    },
    {
      id: 4,
      name: "Mood Tracker",
      description: "Track and monitor your mood",
      icon: "😊",
      path: "/activities/mood-tracker",
    },
    {
      id: 5,
      name: "Sleep Tracker",
      description: "Monitor your sleep patterns",
      icon: "😴",
      path: "/activities/sleep-tracker",
    },
    {
      id: 6,
      name: "Weekly Wellness Report",
      description: "View your weekly mood, sleep, and breathing insights",
      icon: "📊",
      path: "/activities/weekly-wellness-report",
    },
    {
      id: 7,
      name: "Take a Breath",
      description: "Guided breathing exercise for quick relaxation",
      icon: "🌬️",
      path: "/activities/take-a-breath",
    },
  ];

  return (
    <div className="activities-container">
      <h1>Activities</h1>
      <p className="activities-subtitle">
        Explore and engage with our wellness activities
      </p>
      <div className="activities-grid">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-card"
            onClick={() => navigate(activity.path)}
          >
            <div className="activity-icon">{activity.icon}</div>
            <h3>{activity.name}</h3>
            <p>{activity.description}</p>
            <div className="activity-footer">
              <span className="activity-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Activities;
