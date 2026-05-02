import React, { useState, useEffect } from "react";
import Lottie from "lottie-web";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const animationCache = new Map();

const getAnimationData = async (animationPath) => {
  if (animationCache.has(animationPath)) {
    return animationCache.get(animationPath);
  }

  const response = await fetch(animationPath);
  if (!response.ok) {
    throw new Error(`Failed to load animation: ${animationPath}`);
  }

  const data = await response.json();
  animationCache.set(animationPath, data);
  return data;
};

const loadLottieAnimation = async ({ container, animationPath, loop = true, autoplay = true }) => {
  const animationData = await getAnimationData(animationPath);
  return Lottie.loadAnimation({
    container,
    renderer: "svg",
    loop,
    autoplay,
    animationData,
  });
};

const sanitizePdfText = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n\r\t]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// MOOD LEVELS CONFIGURATION
// You can adjust the number of mood levels here
const MOOD_LEVELS = [
  // POSITIVE - LOW ENERGY
  {
    category: "Positive",
    subcategory: "Low Energy",
    animation: "/animations/relax.json",
    mood: "Calm",
    color: "#4CAF50",
    bgColor: "#E8F5E9",
    emoji: "😌",
    score: 4,
  },
  {
    category: "Positive",
    subcategory: "Low Energy",
    animation: "/animations/relax.json",
    mood: "Relaxed",
    color: "#66BB6A",
    bgColor: "#E8F5E9",
    emoji: "😌",
    score: 4,
  },
  {
    category: "Positive",
    subcategory: "Low Energy",
    animation: "/animations/content.json",
    mood: "Content",
    color: "#26A69A",
    bgColor: "#E0F2F1",
    emoji: "😊",
    score: 4.2,
  },
  {
    category: "Positive",
    subcategory: "Low Energy",
    animation: "/animations/relax.json",
    mood: "Peaceful",
    color: "#00ACC1",
    bgColor: "#E0F7FA",
    emoji: "😇",
    score: 4.5,
  },
  {
    category: "Positive",
    subcategory: "Low Energy",
    animation: "/animations/happy.json",
    mood: "Grateful",
    color: "#673AB7",
    bgColor: "#EDE7F6",
    emoji: "🙏",
    score: 5,
  },

  // POSITIVE - HIGH ENERGY
  {
    category: "Positive",
    subcategory: "High Energy",
    animation: "/animations/happy.json",
    mood: "Excited",
    color: "#FFD700",
    bgColor: "#FFF9C4",
    emoji: "🤩",
    score: 5,
  },
  {
    category: "Positive",
    subcategory: "High Energy",
    animation: "/animations/happy.json",
    mood: "Joyful",
    color: "#FFB300",
    bgColor: "#FFF8E1",
    emoji: "😄",
    score: 5,
  },
  {
    category: "Positive",
    subcategory: "High Energy",
    animation: "/animations/happy.json",
    mood: "Thrilled",
    color: "#FF8F00",
    bgColor: "#FFF3E0",
    emoji: "🥳",
    score: 5,
  },
  {
    category: "Positive",
    subcategory: "High Energy",
    animation: "/animations/happy.json",
    mood: "Inspired",
    color: "#9C27B0",
    bgColor: "#F3E5F5",
    emoji: "✨",
    score: 4.7,
  },
  {
    category: "Positive",
    subcategory: "High Energy",
    animation: "/animations/happy.json",
    mood: "Playful",
    color: "#E91E63",
    bgColor: "#FCE4EC",
    emoji: "😜",
    score: 4.5,
  },

  // NEGATIVE - LOW ENERGY
  {
    category: "Negative",
    subcategory: "Low Energy",
    animation: "/animations/sad.json",
    mood: "Depressed",
    color: "#5C6BC0",
    bgColor: "#E8EAF6",
    emoji: "😔",
    score: 1.0,
  },
  {
    category: "Negative",
    subcategory: "Low Energy",
    animation: "/animations/tired.json",
    mood: "Tired",
    color: "#8D6E63",
    bgColor: "#EFEBE9",
    emoji: "😴",
    score: 2.0,
  },
  {
    category: "Negative",
    subcategory: "Low Energy",
    animation: "/animations/sad.json",
    mood: "Disappointed",
    color: "#7E57C2",
    bgColor: "#F3E5F5",
    emoji: "😞",
    score: 1.5,
  },
  {
    category: "Negative",
    subcategory: "Low Energy",
    animation: "/animations/angry.json",
    mood: "Annoyed",
    color: "#FB8C00",
    bgColor: "#FFF3E0",
    emoji: "😒",
    score: 2.5,
  },
  {
    category: "Negative",
    subcategory: "Low Energy",
    animation: "/animations/sad.json",
    mood: "Bored",
    color: "#B0BEC5",
    bgColor: "#F5F5F5",
    emoji: "😑",
    score: 2.2,
  },

  // NEGATIVE - HIGH ENERGY
  {
    category: "Negative",
    subcategory: "High Energy",
    animation: "/animations/anxious.json",
    mood: "Anxious",
    color: "#FFA726",
    bgColor: "#FFF3E0",
    emoji: "😰",
    score: 1.5,
  },
  {
    category: "Negative",
    subcategory: "High Energy",
    animation: "/animations/anxious.json",
    mood: "Overwhelmed",
    color: "#F44336",
    bgColor: "#FFEBEE",
    emoji: "🤯",
    score: 1.0,
  },
  {
    category: "Negative",
    subcategory: "High Energy",
    animation: "/animations/anxious.json",
    mood: "Panicked",
    color: "#D32F2F",
    bgColor: "#FFEBEE",
    emoji: "😱",
    score: 0.5,
  },
  {
    category: "Negative",
    subcategory: "High Energy",
    animation: "/animations/angry.json",
    mood: "Irritated",
    color: "#E64A19",
    bgColor: "#FBE9E7",
    emoji: "😤",
    score: 2.0,
  },
  {
    category: "Negative",
    subcategory: "High Energy",
    animation: "/animations/angry.json",
    mood: "Frustrated",
    color: "#D84315",
    bgColor: "#FBE9E7",
    emoji: "😖",
    score: 1.2,
  },
];

const moods = MOOD_LEVELS;

import axiosInstance from "../../utils/axios.instance";
import { useSelector, useDispatch } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import TokenRewardModal from "../../components/TokenRewardModal";

const MoodTrackerScreen = ({ navigation }) => {
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();

  const [selectedMood, setSelectedMood] = useState(null);
  const [reason, setReason] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'week', 'month'
  const [isLoading, setIsLoading] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardData, setRewardData] = useState({ amount: 0, message: "" });

  // Group moods for organized display
  const groupedMoods = moods.reduce((acc, mood) => {
    if (!acc[mood.category]) acc[mood.category] = {};
    if (!acc[mood.category][mood.subcategory]) acc[mood.category][mood.subcategory] = [];
    acc[mood.category][mood.subcategory].push(mood);
    return acc;
  }, {});

  useEffect(() => {
    if (userId) {
      loadMoodHistory();
    }
  }, [userId]);

  // Initialize Lottie animations
  useEffect(() => {
    let isMounted = true;
    const animations = [];

    moods.forEach((mood, index) => {
      const container = document.getElementById(`lottie-${mood.mood}-${index}`);
      if (!container) return;

      loadLottieAnimation({ container, animationPath: mood.animation })
        .then((animation) => {
          if (!isMounted) {
            animation?.destroy();
            return;
          }
          animations.push(animation);
        })
        .catch((error) => {
          console.error(`Error loading ${mood.mood} animation:`, error);
        });
    });

    return () => {
      isMounted = false;
      animations.forEach((animation) => animation?.destroy());
    };
  }, []);

  useEffect(() => {
    if (selectedMood) {
      const container = document.getElementById('selected-mood-animation');
      if (container) {
        container.innerHTML = '';
        let currentAnimation;

        loadLottieAnimation({ container, animationPath: selectedMood.animation })
          .then((animation) => {
            currentAnimation = animation;
          })
          .catch((error) => {
            console.error(`Error loading selected mood animation (${selectedMood.mood}):`, error);
          });

        return () => {
          currentAnimation?.destroy();
        };
      }
    }
  }, [selectedMood]);

  useEffect(() => {
    // Load history animations after they're rendered
    let isMounted = true;
    const animations = [];

    moodHistory.forEach((item, index) => {
      const container = document.getElementById(`history-lottie-${index}`);
      if (container) {
        const moodObj = moods.find(m => m.mood === item.mood);
        if (moodObj) {
          loadLottieAnimation({ container, animationPath: moodObj.animation })
            .then((animation) => {
              if (!isMounted) {
                animation?.destroy();
                return;
              }
              animations.push(animation);
            })
            .catch((error) => {
              console.error(`Error loading history animation (${moodObj.mood}):`, error);
            });
        }
      }
    });

    return () => {
      isMounted = false;
      animations.forEach((animation) => animation?.destroy());
    };
  }, [moodHistory]);

  const saveMood = async () => {
    if (!selectedMood || !userId) return;

    const newEntry = {
      mood: selectedMood.mood,
      moodEmoji: selectedMood.emoji,
      moodColor: selectedMood.color,
      reason,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    try {
      setIsLoading(true);
      const res = await axiosInstance.post("/activities/save", {
        activityType: "mood",
        data: newEntry
      });

      if (res.data?.updatedTokens !== null) {
        dispatch(updateTokens(res.data.updatedTokens));
        setRewardData({ amount: 5, message: "Your mood has been logged. Keep up the great work on your wellness journey!" });
        setShowRewardModal(true);
      }

      // Refetch history after saving
      await loadMoodHistory();

      setSelectedMood(null);
      setReason("");
      setShowReasonInput(false);
    } catch (error) {
      console.error("Error saving mood:", error);
      alert("Failed to save mood. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoodHistory = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/activities");
      const activities = response.data.activities || [];

      // Filter only mood activities and extract the data
      const history = activities
        .filter(act => act.activity_type === "mood")
        .map(act => ({
          id: act.id,
          ...act.data
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setMoodHistory(history);
    } catch (error) {
      console.error("Error loading mood history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your mood history? (This will only clear your local view, database entries require admin intervention)")) {
      clearHistory();
    }
  };

  const clearHistory = async () => {
    setMoodHistory([]);
    // Note: The backend activities API doesn't seem to have a bulk delete for a specific type yet.
  };

  const deleteEntry = (id) => {
    // Note: The backend activities API doesn't seem to have a specific delete by ID endpoint yet.
    // We'll just filter from local state for now if we can't delete from DB.
    if (window.confirm("Delete this mood entry from view?")) {
      const updatedHistory = moodHistory.filter(entry => entry.id !== id);
      setMoodHistory(updatedHistory);
    }
  };

  const getFilteredHistory = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return moodHistory.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      if (filter === 'week') {
        return entryDate >= oneWeekAgo;
      } else if (filter === 'month') {
        return entryDate >= oneMonthAgo;
      }
      return true;
    });
  };

  const getMoodStats = () => {
    const stats = {
      moods: {},
      categories: {},
      subcategories: {}
    };

    filteredHistory.forEach(entry => {
      // Mood count
      stats.moods[entry.mood] = (stats.moods[entry.mood] || 0) + 1;

      // Category/Subcategory count
      const moodObj = moods.find(m => m.mood === entry.mood);
      if (moodObj) {
        stats.categories[moodObj.category] = (stats.categories[moodObj.category] || 0) + 1;
        stats.subcategories[moodObj.subcategory] = (stats.subcategories[moodObj.subcategory] || 0) + 1;
      }
    });

    return stats;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const filteredHistory = getFilteredHistory();
    const moodStats = getMoodStats();

    // Title
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234);
    doc.text("Mood Tracker Report", 105, 20, { align: "center" });

    // Date range and filter info
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const filterText = filter === 'all' ? 'All Time' : filter === 'week' ? 'Last 7 Days' : 'Last 30 Days';
    doc.text(`Period: ${filterText}`, 105, 30, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 105, 37, { align: "center" });

    // Summary Statistics
    doc.setFontSize(16);
    doc.setTextColor(51, 51, 51);
    doc.text("Mood Statistics", 14, 50);

    // Total entries
    doc.setFontSize(11);
    doc.setTextColor(102, 126, 234);
    doc.text(`Total Entries: ${filteredHistory.length}`, 14, 60);

    // Mood distribution table
    const statsData = Object.entries(moodStats.moods).map(([mood, count]) => {
      const percentage = ((count / filteredHistory.length) * 100).toFixed(1);
      return [
        sanitizePdfText(mood),
        count,
        `${percentage}%`
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [["Mood", "Count", "Percentage"]],
      body: statsData,
      theme: "grid",
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 }
    });

    // Mood History
    doc.setFontSize(16);
    doc.setTextColor(51, 51, 51);
    doc.text("Mood History", 14, (doc.lastAutoTable?.finalY || 65) + 20);

    const historyData = filteredHistory.map((item) => {
      return [
        sanitizePdfText(item.mood),
        sanitizePdfText(item.date),
        sanitizePdfText(item.time),
        sanitizePdfText(item.reason || "No reason provided")
      ];
    });

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 65) + 25,
      head: [["Mood", "Date", "Time", "Reason"]],
      body: historyData,
      theme: "striped",
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        3: { cellWidth: 60 }
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Add header on each page
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Mood Tracker Report - " + new Date().toLocaleDateString(),
          data.settings.margin.left,
          10
        );
      }
    });

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save the PDF with formatted filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filterStr = filter !== 'all' ? `-${filter}` : '';
    doc.save(`mood-tracker-report-${dateStr}${filterStr}.pdf`);
  };

  const filteredHistory = getFilteredHistory();
  const moodStats = getMoodStats();

  const handleBack = () => {
    if (navigation && typeof navigation.goBack === "function") {
      navigation.goBack();
      return;
    }
    window.history.back();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)",
        padding: "20px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 12s ease-in-out infinite reverse",
      }} />

      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
        `}
      </style>

      {/* Header with back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "30px",
          maxWidth: "1200px",
          margin: "0 auto 30px auto",
        }}
      >
        <button
          onClick={handleBack}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
            boxShadow: "0 5px 15px rgba(102, 126, 234, 0.4)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          ←
        </button>

        <h1
          style={{
            fontSize: "32px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
            fontWeight: "bold",
          }}
        >
          Mood Tracker 🌈
        </h1>

        <div style={{ width: "40px" }} /> {/* Spacer */}
      </div>

      {/* Main content container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Mood Selection Grid */}
        {!selectedMood ? (
          <>
            <div style={{ marginBottom: "40px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  color: "#333",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                How are you feeling today?
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                {Object.entries(groupedMoods).map(([category, subcategories]) => (
                  <div key={category} style={{
                    background: category === "Positive" ? "rgba(232, 245, 233, 0.5)" : "rgba(255, 235, 238, 0.5)",
                    padding: "20px",
                    borderRadius: "25px",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
                  }}>
                    <h3 style={{
                      fontSize: "20px",
                      color: category === "Positive" ? "#2E7D32" : "#C62828",
                      marginBottom: "15px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      {category === "Positive" ? "✨ Positive Moods" : "⛈️ Negative Moods"}
                    </h3>

                    {Object.entries(subcategories).map(([subcategory, subMoods]) => (
                      <div key={subcategory} style={{ marginBottom: "20px" }}>
                        <h4 style={{
                          fontSize: "14px",
                          color: "#666",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: "10px",
                          paddingLeft: "10px"
                        }}>
                          {subcategory}
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          {subMoods.map((mood, idx) => {
                            const originalIndex = moods.findIndex(m => m.mood === mood.mood);
                            return (
                              <button
                                key={mood.mood}
                                onClick={() => {
                                  setSelectedMood(mood);
                                  setShowReasonInput(true);
                                }}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  padding: "15px 10px",
                                  background: `linear-gradient(135deg, ${mood.bgColor} 0%, white 100%)`,
                                  border: `2px solid ${mood.color}`,
                                  borderRadius: "18px",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                                  backdropFilter: "blur(5px)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-3px)";
                                  e.currentTarget.style.boxShadow = `0 10px 20px ${mood.color}30`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.08)";
                                }}
                              >
                                <div
                                  id={`lottie-${mood.mood}-${originalIndex}`}
                                  style={{ width: "50px", height: "50px" }}
                                />
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    marginTop: "8px",
                                    color: mood.color,
                                    textAlign: "center"
                                  }}
                                >
                                  {mood.emoji} {mood.mood}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Selected Mood Input */
          <div
            style={{
              background: "linear-gradient(135deg, rgba(245, 247, 250, 0.9) 0%, rgba(195, 207, 226, 0.9) 100%)",
              borderRadius: "20px",
              padding: "30px",
              marginBottom: "40px",
              textAlign: "center",
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "28px",
                color: "#333",
                marginBottom: "20px",
              }}
            >
              You selected:
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  background: selectedMood.bgColor,
                  padding: "20px",
                  borderRadius: "50%",
                  boxShadow: `0 10px 30px ${selectedMood.color}80`,
                }}
              >
                <div
                  id="selected-mood-animation"
                  style={{ width: "80px", height: "80px" }}
                />
              </div>

              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: selectedMood.color,
                }}
              >
                {selectedMood.emoji} {selectedMood.mood}
              </span>

              {showReasonInput && (
                <div style={{ width: "100%", maxWidth: "500px" }}>
                  <textarea
                    placeholder="Why do you feel this way? (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "15px",
                      border: `2px solid ${selectedMood.color}`,
                      borderRadius: "15px",
                      fontSize: "16px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      marginBottom: "15px",
                      background: "rgba(255,255,255,0.9)",
                    }}
                  />

                  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button
                      onClick={saveMood}
                      style={{
                        background: `linear-gradient(135deg, ${selectedMood.color}, ${selectedMood.color}dd)`,
                        padding: "12px 30px",
                        borderRadius: "50px",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: `0 5px 15px ${selectedMood.color}80`,
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    >
                      Save Mood ✨
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMood(null);
                        setReason("");
                        setShowReasonInput(false);
                      }}
                      style={{
                        background: "#f44336",
                        padding: "12px 30px",
                        borderRadius: "50px",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        boxShadow: "0 5px 15px #f4433680",
                        transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mood over Time Chart */}
        {filteredHistory.length > 0 && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              backdropFilter: "blur(10px)",
              height: "400px"
            }}
          >
            <h3 style={{ fontSize: "20px", color: "#333", marginBottom: "20px" }}>
              📈 Mood Over Time
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart
                data={[...filteredHistory].reverse().map(entry => {
                  const moodObj = moods.find(m => m.mood === entry.mood);
                  return {
                    date: entry.date,
                    score: moodObj ? moodObj.score : 3,
                    mood: entry.mood,
                    emoji: entry.moodEmoji
                  };
                })}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#764ba2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  hide
                  domain={[0, 6]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          background: 'white',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '10px',
                          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.date}</p>
                          <p style={{ margin: 0, color: '#667eea' }}>
                            {data.emoji} {data.mood}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#667eea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mood Statistics */}
        {filteredHistory.length > 0 && (
          <div
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ fontSize: "20px", color: "#333", margin: 0 }}>
                📊 Your Mood Statistics
              </h3>
              <span style={{ fontSize: "14px", color: "#667eea", background: "#f0f0f0", padding: "5px 10px", borderRadius: "50px" }}>
                Total: {filteredHistory.length} entries
              </span>
            </div>
            {/* Category Summary */}
            <div style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              padding: "15px",
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "15px",
              overflowX: "auto"
            }}>
              {Object.entries(moodStats.categories).map(([cat, count]) => (
                <div key={cat} style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>{cat}</div>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: cat === "Positive" ? "#2E7D32" : "#C62828" }}>
                    {count} <span style={{ fontSize: "14px", fontWeight: "normal" }}>({((count / filteredHistory.length) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
              {Object.entries(moodStats.subcategories).map(([sub, count]) => (
                <div key={sub} style={{ flex: 1, minWidth: "120px", textAlign: "center", borderLeft: "1px solid #ddd", paddingLeft: "15px" }}>
                  <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase" }}>{sub}</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#444" }}>{count}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "10px",
              }}
            >
              {Object.entries(moodStats.moods).map(([mood, count]) => {
                const moodData = moods.find(m => m.mood === mood);
                const percentage = ((count / filteredHistory.length) * 100).toFixed(1);
                return (
                  <div
                    key={mood}
                    style={{
                      background: moodData?.bgColor || "#f5f5f5",
                      padding: "10px",
                      borderRadius: "10px",
                      textAlign: "center",
                      border: `1px solid ${moodData?.color}20`
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{moodData?.emoji}</span>
                    <div style={{ fontSize: "13px", color: "#666", fontWeight: "500" }}>{mood}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: moodData?.color }}>
                      {count}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mood History Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <h2 style={{ fontSize: "24px", color: "#333", margin: 0 }}>
              📝 Mood History
            </h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {/* Filter Buttons */}
              <div style={{ display: "flex", gap: "5px", background: "#f0f0f0", padding: "5px", borderRadius: "50px" }}>
                <button
                  onClick={() => setFilter("all")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "50px",
                    border: "none",
                    background: filter === "all" ? "#667eea" : "transparent",
                    color: filter === "all" ? "white" : "#666",
                    cursor: "pointer",
                    fontWeight: filter === "all" ? "bold" : "normal",
                    transition: "all 0.2s",
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("week")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "50px",
                    border: "none",
                    background: filter === "week" ? "#667eea" : "transparent",
                    color: filter === "week" ? "white" : "#666",
                    cursor: "pointer",
                    fontWeight: filter === "week" ? "bold" : "normal",
                    transition: "all 0.2s",
                  }}
                >
                  Week
                </button>
                <button
                  onClick={() => setFilter("month")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "50px",
                    border: "none",
                    background: filter === "month" ? "#667eea" : "transparent",
                    color: filter === "month" ? "white" : "#666",
                    cursor: "pointer",
                    fontWeight: filter === "month" ? "bold" : "normal",
                    transition: "all 0.2s",
                  }}
                >
                  Month
                </button>
              </div>

              {/* Download PDF Button - Always visible when there's history */}
              {filteredHistory.length > 0 && (
                <button
                  onClick={downloadPDF}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "50px",
                    border: "none",
                    background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    boxShadow: "0 3px 10px rgba(76, 175, 80, 0.3)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 5px 15px rgba(76, 175, 80, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "0 3px 10px rgba(76, 175, 80, 0.3)";
                  }}
                >
                  <span style={{ fontSize: "16px" }}>📄</span>
                  Download PDF {filter !== 'all' && `(${filter === 'week' ? 'Week' : 'Month'})`}
                </button>
              )}
            </div>
          </div>

          {/* History List */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              padding: "10px",
            }}
          >
            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
                <span style={{ fontSize: "64px", display: "block", marginBottom: "20px" }}>📭</span>
                <p style={{ fontSize: "18px", marginBottom: "10px" }}>No mood entries found</p>
                <p style={{ fontSize: "14px" }}>Start tracking your mood to see your history here!</p>
              </div>
            ) : (
              filteredHistory.map((item, index) => {
                const moodData = moods.find(m => m.mood === item.mood);
                return (
                  <div
                    key={item.id || index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "15px",
                      background: moodData?.bgColor || "#f9f9f9",
                      borderRadius: "15px",
                      marginBottom: "10px",
                      transition: "all 0.2s",
                      border: `1px solid ${moodData?.color}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(5px)";
                      e.currentTarget.style.boxShadow = `0 5px 15px ${moodData?.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                      <div
                        id={`history-lottie-${index}`}
                        style={{ width: "40px", height: "40px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "18px", fontWeight: "bold", color: moodData?.color }}>
                            {item.moodEmoji} {item.mood}
                          </span>
                          <span style={{ fontSize: "12px", color: "#999", background: "white", padding: "2px 8px", borderRadius: "50px" }}>
                            {item.time}
                          </span>
                        </div>
                        {item.reason && (
                          <p style={{ fontSize: "14px", color: "#666", margin: "5px 0", fontStyle: "italic" }}>
                            "{item.reason}"
                          </p>
                        )}
                        <p style={{ fontSize: "11px", color: "#999", margin: "5px 0 0" }}>
                          {item.date}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteEntry(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "20px",
                        cursor: "pointer",
                        opacity: 0.5,
                        transition: "all 0.2s",
                        padding: "5px 10px",
                        borderRadius: "50%",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = 1;
                        e.target.style.background = "#ffebee";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = 0.5;
                        e.target.style.background = "none";
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Clear History Button */}
          {moodHistory.length > 0 && (
            <button
              onClick={confirmClearHistory}
              style={{
                background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                padding: "12px 24px",
                borderRadius: "50px",
                border: "none",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                marginTop: "20px",
                boxShadow: "0 5px 15px rgba(244, 67, 54, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.02)";
                e.target.style.boxShadow = "0 8px 20px rgba(244, 67, 54, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 5px 15px rgba(244, 67, 54, 0.3)";
              }}
            >
              Clear All History 🗑️
            </button>
          )}
        </div>
      </div>
      <TokenRewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)}
        amount={rewardData.amount}
        message={rewardData.message}
      />
    </div>
  );
};

export default MoodTrackerScreen;