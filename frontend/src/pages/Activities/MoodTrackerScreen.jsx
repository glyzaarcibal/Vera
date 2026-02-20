import React, { useState, useEffect } from "react";
import Lottie from "lottie-web";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    const stats = {};
    filteredHistory.forEach(entry => {
      stats[entry.mood] = (stats[entry.mood] || 0) + 1;
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
    const statsData = Object.entries(moodStats).map(([mood, count]) => {
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
        {filteredHistory.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "30px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.05)",
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "10px",
              }}
            >
              {Object.entries(moodStats).map(([mood, count]) => {
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
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{moodData?.emoji}</span>
                    <div style={{ fontSize: "14px", color: "#666" }}>{mood}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: moodData?.color }}>
                      {count}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
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
    </div>
  );
};

export default MoodTrackerScreen;