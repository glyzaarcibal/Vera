import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors.js";
import { motion } from "framer-motion";
import { Sparkles, Moon, Brain, Wind, Edit3, Activity as ActivityIcon, ChevronRight, Zap, Smile, Pill, BarChart } from "lucide-react";
import axiosInstance from "../utils/axios.instance.js";

// Import images
import clipcardImg from "../assets/images/clipcard_new.png";
import diaryImg from "../assets/images/diary.png";
import sleepImg from "../assets/images/sleep.png";
import breatheImg from "../assets/images/breathe_deeply.png";
import moodImg from "../assets/images/mood_tracker.png";
import medicationImg from "../assets/images/medication_tracker.png";
import reportImg from "../assets/images/wellness_report.png";

import "./Activities.css";

const Activities = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [wellnessMetrics, setWellnessMetrics] = useState({
    vitalityScore: 0,
    averageSleep: 0,
    sleepStatus: "No Data",
    loading: true
  });

  const fetchWellnessData = async () => {
    try {
      setWellnessMetrics(prev => ({ ...prev, loading: true }));
      const response = await axiosInstance.get("/activities");
      const logs = response.data.activities || [];

      if (!logs || logs.length === 0) {
        setWellnessMetrics({
          vitalityScore: 0,
          averageSleep: 0,
          sleepStatus: "No Data",
          loading: false
        });
        return;
      }

      // Calculate Sleep Metrics
      const sleepLogs = logs.filter(a => a.activity_type === 'sleep');
      const recentSleep = sleepLogs.slice(0, 7);
      let totalMinutes = 0;
      recentSleep.forEach(log => {
        const durationStr = log.data?.duration || "0h 0m";
        const hMatch = durationStr.match(/(\d+)h/);
        const mMatch = durationStr.match(/(\d+)m/);
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        totalMinutes += (h * 60) + m;
      });
      const avgSleepMinutes = recentSleep.length > 0 ? totalMinutes / recentSleep.length : 0;
      const avgSleepHours = parseFloat((avgSleepMinutes / 60).toFixed(1));

      // Calculate Vitality Score (Robust logic for diversity/engagement)
      const activityTypes = logs.map(a => (a.activity_type || a.activityType || "").toLowerCase()).filter(t => t !== "");
      const uniqueTypes = new Set(activityTypes).size;
      const diversityScore = Math.min((uniqueTypes / 6) * 50, 50);
      const engagementScore = Math.min((logs.length / 10) * 50, 50);
      const vitality = Math.round(diversityScore + engagementScore);

      setWellnessMetrics({
        vitalityScore: vitality,
        averageSleep: avgSleepHours,
        sleepStatus: avgSleepHours >= 7 ? "Deep Rest" : avgSleepHours > 0 ? "Resting" : "No Data",
        loading: false
      });
    } catch (e) {
      console.error(e);
      setWellnessMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const filters = ["All", "Games", "Breathing", "Journaling", "Sleep", "Tracker", "Report"];

  const wellnessActivities = [
    {
      id: 1,
      name: "Clipcard Game",
      description: "Enhance your cognitive focus with this quick-play memory challenge.",
      category: "Mind Exercise",
      type: "Games",
      path: "/activities/clipcard",
      color: "#10B981",
      buttonText: "Play Now",
      image: clipcardImg
    },
    {
      id: 2,
      name: "Breathe Deeply",
      description: "A guided 5-minute session to center your nervous system.",
      category: "Relaxation",
      type: "Breathing",
      path: "/activities/take-a-breath",
      color: "#7C3AED",
      buttonText: "Start Breathwork",
      image: breatheImg
    },
    {
      id: 3,
      name: "Digital Diary",
      description: "Release your thoughts. Private, encrypted journaling for your peace.",
      category: "Reflection",
      type: "Journaling",
      path: "/activities/diary",
      color: "#6B7280",
      buttonText: "Write Today",
      image: diaryImg
    },
    {
      id: 4,
      name: "Sleep Tracker",
      description: "Deep dive into your rest patterns and circadian rhythm optimization.",
      category: "Insight",
      type: "Sleep",
      path: "/activities/sleep-tracker",
      color: "#1E1B4B",
      buttonText: "View History",
      image: sleepImg
    },
    {
      id: 5,
      name: "Mood Tracker",
      description: "Log your daily emotional state and discover mood patterns.",
      category: "Reflection",
      type: "Tracker",
      path: "/activities/mood-tracker",
      color: "#10B981",
      buttonText: "Log Mood",
      image: moodImg
    },
    {
      id: 6,
      name: "Medication Tracker",
      description: "Securely log your medication schedule to stay consistent.",
      category: "Insight",
      type: "Tracker",
      path: "/activities/medication-history",
      color: "#EF4444",
      buttonText: "View Schedule",
      image: medicationImg
    },
    {
      id: 7,
      name: "Wellness Report",
      description: "A comprehensive weekly overview of your activities and progress.",
      category: "Insight",
      type: "Report",
      path: "/activities/weekly-wellness-report",
      color: "#F59E0B",
      buttonText: "View Report",
      image: reportImg
    }
  ];

  const filteredActivities = activeFilter === "All"
    ? wellnessActivities
    : wellnessActivities.filter(a => a.type === activeFilter);

  return (
    <div className="act-v2-container">
      {/* HEADER SECTION */}
      <header className="act-v2-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="act-v2-title"
        >
          Wellness Activities
        </motion.h1>
        <p className="act-v2-subtitle">
          Take a moment for yourself today. Explore curated exercises designed
          to nurture your mind, body, and spirit.
        </p>
      </header>

      {/* STATS SECTION */}
      <div className="act-v2-stats-grid">
        {/* Vitality Card */}
        <motion.div
          className="act-v2-stat-card vitality"
          whileHover={{ y: -5 }}
        >
          <div className="stat-info">
            <span className="stat-label">CURRENT VITALITY</span>
            <div className="stat-value-group">
              <span className="stat-number">{wellnessMetrics.vitalityScore}</span>
              <span className="stat-total">/100</span>
            </div>
            <p className="stat-desc">
              You're doing excellent today! Your energy levels are 12% higher than yesterday.
            </p>
          </div>
          <div className="stat-visual">
            <div className="vitality-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" className="ring-bg" />
                <circle
                  cx="50" cy="50" r="45"
                  className="ring-fill"
                  style={{ strokeDashoffset: 282 - (282 * wellnessMetrics.vitalityScore) / 100 }}
                />
              </svg>
              <div className="ring-center">
                <Zap size={20} fill="currentColor" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sleep Card */}
        <motion.div
          className="act-v2-stat-card sleep"
          whileHover={{ y: -5 }}
        >
          <div className="stat-info">
            <span className="stat-label">SLEEP QUALITY</span>
            <div className="sleep-status-row">
              <div className="sleep-icon-box">
                <Moon size={18} fill="currentColor" />
              </div>
              <div className="sleep-text">
                <h3>{wellnessMetrics.loading ? "..." : wellnessMetrics.sleepStatus}</h3>
                <span>{wellnessMetrics.loading ? "..." : `${wellnessMetrics.averageSleep}h total`}</span>
              </div>
            </div>
            <div className="sleep-bar-chart">
              {[40, 60, 80, 100, 60, 80].map((h, i) => (
                <div key={i} className="sleep-bar-wrapper">
                  <div
                    className={`sleep-bar ${i === 3 ? 'active' : ''}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* FILTERS */}
      <div className="act-v2-filters">
        <span className="filter-label">FILTER BY</span>
        <div className="filter-pills">
          {filters.map(f => (
            <button
              key={f}
              className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVITY GRID */}
      <div className="act-v2-grid">
        {filteredActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="act-v2-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(activity.path)}
          >
            <div className="card-image-section">
              <img src={activity.image} alt={activity.name} className="card-img" />
            </div>
            <div className="card-body">
              <div className="card-meta">
                {activity.category === "Mind Exercise" && <Brain size={14} color="#10B981" />}
                {activity.category === "Relaxation" && <Sparkles size={14} color="#7C3AED" />}
                {activity.category === "Reflection" && <Edit3 size={14} color="#6B7280" />}
                {activity.category === "Insight" && <ActivityIcon size={14} color="#1E1B4B" />}
                <span className="card-category" style={{ color: activity.color }}>{activity.category.toUpperCase()}</span>
              </div>
              <h4 className="card-name">{activity.name}</h4>
              <p className="card-description">{activity.description}</p>
              <button
                className="card-action-btn"
                style={{ backgroundColor: activity.color, color: 'white' }}
                onClick={() => navigate(activity.path)}
              >
                {activity.buttonText}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BOTTOM CTA */}
      <motion.div
        className="act-v2-cta-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="cta-icon-outer">
          <div className="cta-icon-inner">
            <Sparkles size={20} color="#7C3AED" fill="#7C3AED" />
          </div>
        </div>
        <h2 className="cta-title">The Evening Wind-Down</h2>
        <p className="cta-desc">
          V.E.R.A. suggests a 10-minute mindfulness session before bed to
          increase your REM sleep quality by up to 20% tonight.
        </p>
        <button className="cta-btn" onClick={() => navigate("/activities/take-a-breath")}>
          Begin Ritual
        </button>
      </motion.div>
    </div>
  );
};

export default Activities;
