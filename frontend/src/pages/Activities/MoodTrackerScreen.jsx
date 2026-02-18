import React, { useState, useEffect } from "react";
import Lottie from "lottie-web";

const moods = [
  {
    animation: "/animations/happy.json",
    mood: "Happy",
    color: "#FFD700",
    bgColor: "#FFF9C4",
    emoji: "😊",
  },
  {
    animation: "/animations/sad.json",
    mood: "Sad",
    color: "#5C6BC0",
    bgColor: "#E8EAF6",
    emoji: "😢",
  },
  {
    animation: "/animations/angry.json",
    mood: "Angry",
    color: "#EF5350",
    bgColor: "#FFEBEE",
    emoji: "😠",
  },
  {
    animation: "/animations/anxious.json",
    mood: "Anxious",
    color: "#FFA726",
    bgColor: "#FFF3E0",
    emoji: "😰",
  },
  {
    animation: "/animations/tired.json",
    mood: "Tired",
    color: "#8D6E63",
    bgColor: "#EFEBE9",
    emoji: "😴",
  },
  {
    animation: "/animations/relax.json",
    mood: "Relaxed",
    color: "#66BB6A",
    bgColor: "#E8F5E9",
    emoji: "😌",
  },
  {
    animation: "/animations/content.json",
    mood: "Calm",
    color: "#26A69A",
    bgColor: "#E0F2F1",
    emoji: "😊",
  },
];

const MoodTrackerScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [reason, setReason] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'week', 'month'

  useEffect(() => {
    loadMoodHistory();
  }, []);

  useEffect(() => {
    const fetchMoodEntries = async () => {
      try {
        const storedMoods = localStorage.getItem("moodEntries");
        if (storedMoods) {
          const parsedMoods = JSON.parse(storedMoods);
          if (Array.isArray(parsedMoods)) {
            setMoodEntries(parsedMoods);
          } else {
            setMoodEntries([]);
          }
        }
      } catch (error) {
        console.error("Error fetching mood entries:", error);
      }
    };

    fetchMoodEntries();
  }, []);

  // Initialize Lottie animations
  useEffect(() => {
    moods.forEach((mood, index) => {
      const container = document.getElementById(`lottie-${mood.mood}-${index}`);
      if (container) {
        Lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: mood.animation,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (selectedMood) {
      const container = document.getElementById('selected-mood-animation');
      if (container) {
        container.innerHTML = '';
        Lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: selectedMood.animation,
        });
      }
    }
  }, [selectedMood]);

  useEffect(() => {
    // Load history animations after they're rendered
    moodHistory.forEach((item, index) => {
      const container = document.getElementById(`history-lottie-${index}`);
      if (container) {
        const moodObj = moods.find(m => m.mood === item.mood);
        if (moodObj) {
          Lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: moodObj.animation,
          });
        }
      }
    });
  }, [moodHistory]);

  const saveMood = async () => {
    if (!selectedMood) return;

    const newEntry = {
      id: Date.now(),
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
      const updatedHistory = [newEntry, ...moodHistory];
      setMoodHistory(updatedHistory);
      localStorage.setItem("moodHistory", JSON.stringify(updatedHistory));

      setSelectedMood(null);
      setReason("");
      setShowReasonInput(false);
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const loadMoodHistory = async () => {
    const savedHistory = localStorage.getItem("moodHistory");
    if (savedHistory) {
      setMoodHistory(JSON.parse(savedHistory));
    }
  };

  const confirmClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your mood history?")) {
      clearHistory();
    }
  };

  const clearHistory = async () => {
    localStorage.removeItem("moodHistory");
    setMoodHistory([]);
  };

  const deleteEntry = (id) => {
    if (window.confirm("Delete this mood entry?")) {
      const updatedHistory = moodHistory.filter(entry => entry.id !== id);
      setMoodHistory(updatedHistory);
      localStorage.setItem("moodHistory", JSON.stringify(updatedHistory));
    }
  };

  const getFilteredHistory = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));

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
    const stats = {};
    moodHistory.forEach(entry => {
      stats[entry.mood] = (stats[entry.mood] || 0) + 1;
    });
    return stats;
  };

  const filteredHistory = getFilteredHistory();
  const moodStats = getMoodStats();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "30px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Header with back button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "30px",
          }}
        >
          <button
            onClick={() => navigation.goBack()}
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

        {/* Main content */}
        {!selectedMood ? (
          <>
            {/* Mood Selection Grid */}
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
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "15px",
                  padding: "10px",
                }}
              >
                {moods.map((mood, index) => (
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
                      padding: "20px 10px",
                      background: `linear-gradient(135deg, ${mood.bgColor} 0%, white 100%)`,
                      border: `2px solid ${mood.color}`,
                      borderRadius: "20px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow = `0 15px 30px ${mood.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div
                      id={`lottie-${mood.mood}-${index}`}
                      style={{ width: "60px", height: "60px" }}
                    />
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        marginTop: "10px",
                        color: mood.color,
                      }}
                    >
                      {mood.emoji} {mood.mood}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Selected Mood Input */
          <div
            style={{
              background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderRadius: "20px",
              padding: "30px",
              marginBottom: "40px",
              textAlign: "center",
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

        {/* Mood Statistics */}
        {moodHistory.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ fontSize: "20px", color: "#333", marginBottom: "15px" }}>
              📊 Your Mood Statistics
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "10px",
              }}
            >
              {Object.entries(moodStats).map(([mood, count]) => {
                const moodData = moods.find(m => m.mood === mood);
                return (
                  <div
                    key={mood}
                    style={{
                      background: moodData?.bgColor || "#f5f5f5",
                      padding: "10px",
                      borderRadius: "10px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{moodData?.emoji}</span>
                    <div style={{ fontSize: "14px", color: "#666" }}>{mood}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: moodData?.color }}>
                      {count}
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
            background: "white",
            borderRadius: "20px",
            padding: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
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
            
            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "50px",
                  border: "none",
                  background: filter === "all" ? "#667eea" : "#f0f0f0",
                  color: filter === "all" ? "white" : "#666",
                  cursor: "pointer",
                  fontWeight: filter === "all" ? "bold" : "normal",
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
                  background: filter === "week" ? "#667eea" : "#f0f0f0",
                  color: filter === "week" ? "white" : "#666",
                  cursor: "pointer",
                  fontWeight: filter === "week" ? "bold" : "normal",
                }}
              >
                This Week
              </button>
              <button
                onClick={() => setFilter("month")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "50px",
                  border: "none",
                  background: filter === "month" ? "#667eea" : "#f0f0f0",
                  color: filter === "month" ? "white" : "#666",
                  cursor: "pointer",
                  fontWeight: filter === "month" ? "bold" : "normal",
                }}
              >
                This Month
              </button>
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
              <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                <span style={{ fontSize: "48px" }}>📭</span>
                <p>No mood entries found for this period.</p>
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
                      transition: "transform 0.2s",
                      border: `1px solid ${moodData?.color}40`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                      <div
                        id={`history-lottie-${index}`}
                        style={{ width: "40px", height: "40px" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <span style={{ fontSize: "18px", fontWeight: "bold", color: moodData?.color }}>
                            {item.moodEmoji} {item.mood}
                          </span>
                          <span style={{ fontSize: "12px", color: "#999" }}>
                            {item.time}
                          </span>
                        </div>
                        {item.reason && (
                          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                            📝 {item.reason}
                          </p>
                        )}
                        <p style={{ fontSize: "12px", color: "#999", margin: "5px 0 0" }}>
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
                        transition: "opacity 0.2s",
                        padding: "5px 10px",
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.5}
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
                boxShadow: "0 5px 15px #f4433680",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              Clear All History 🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTrackerScreen;