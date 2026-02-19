import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

const TakeABreath = () => {
  const [breathingStage, setBreathingStage] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState([]);
  const [scale, setScale] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  
  const language = useSelector(
    (state) => state.settings?.settings?.language || "English"
  );
  const animationRef = useRef(null);
  const audioRefs = useRef({});

  useEffect(() => {
    loadHistory();
    preloadAudio();
    return () => {
      // Cleanup audio on unmount
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!isBreathing || countdown > 0) return;

    let timing = 0;

    if (breathingStage === 0) {
      playAudio('inhale');
      animateBreath(1.5, 6000);
      timing = 6000;
    } else if (breathingStage === 1) {
      playAudio('hold');
      timing = 7000;
    } else if (breathingStage === 2) {
      playAudio('exhale');
      animateBreath(1, 8000);
      timing = 8000;
    }

    const timer = setTimeout(() => {
      if (breathingStage === 2) {
        if (repeatCount < 1) {
          setRepeatCount(repeatCount + 1);
          setBreathingStage(0);
        } else {
          setIsBreathing(false);
          setBreathingStage(0);
          setRepeatCount(0);
          addHistory();
        }
      } else {
        setBreathingStage((prevStage) => prevStage + 1);
      }
    }, timing);

    return () => clearTimeout(timer);
  }, [
    breathingStage,
    isBreathing,
    countdown,
    repeatCount,
    language,
  ]);

  const animateBreath = (targetScale, duration) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startScale = scale;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const newScale = startScale + (targetScale - startScale) * easeProgress;
      
      setScale(newScale);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const preloadAudio = () => {
    // Define audio files with paths - you'll need to host these files
    const audioFiles = {
      getReady: {
        english: "/audio/breath/get-ready-in.mp3",
        tagalog: "/audio/breath/humandakasabilang.mp3"
      },
      inhale: {
        english: "/audio/breath/inhale.mp3",
        tagalog: "/audio/breath/huminga.mp3"
      },
      exhale: {
        english: "/audio/breath/exhale.mp3",
        tagalog: "/audio/breath/huminganangpalabas.mp3"
      },
      hold: {
        english: "/audio/breath/hold.mp3",
        tagalog: "/audio/breath/Pigil.mp3"
      },
      countdown3: {
        english: "/audio/breath/countdown3.mp3",
        tagalog: "/audio/breath/countdown3tagalog.mp3"
      },
      countdown2: {
        english: "/audio/breath/countdown2.mp3",
        tagalog: "/audio/breath/countdown2tagalog.mp3"
      },
      countdown1: {
        english: "/audio/breath/countdown1.mp3",
        tagalog: "/audio/breath/countdown1tagalog.mp3"
      }
    };

    // Preload audio files
    Object.entries(audioFiles).forEach(([key, paths]) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = language === "Tagalog" ? paths.tagalog : paths.english;
      audioRefs.current[key] = audio;
    });
  };

  const playAudio = (audioKey) => {
    try {
      const audio = audioRefs.current[audioKey];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => console.log("Error playing sound:", error));
      }
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

  const addHistory = async () => {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const newHistory = [
      { session: history.length + 1, date, time },
      ...history,
    ];

    setHistory(newHistory);
    try {
      localStorage.setItem("breathingHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const savedHistory = localStorage.getItem("breathingHistory");
      if (savedHistory) {
        setHistory(
          JSON.parse(savedHistory).sort((a, b) => b.session - a.session)
        );
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const startBreathing = async () => {
    setIsBreathing(true);
    setBreathingStage(0);
    setCountdown(3);

    playAudio('getReady');
    
    setTimeout(() => {
      setCountdown(3);
      playAudio('countdown3');
    }, 1000);

    setTimeout(() => {
      setCountdown(2);
      playAudio('countdown2');
    }, 2000);

    setTimeout(() => {
      setCountdown(1);
      playAudio('countdown1');
    }, 3000);

    setTimeout(() => {
      setCountdown(0);
    }, 4000);
  };

  const stageText = () => {
    if (!isBreathing) return "";
    if (countdown > 0) return `Get ready... ${countdown}`;
    return ["Inhale...", "Hold...", "Exhale..."][breathingStage] || "";
  };

  const handleBack = () => {
    window.history.back();
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      localStorage.removeItem("breathingHistory");
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '20px',
      background: 'linear-gradient(135deg, #ffffff, #d4edda)',
    },
    backButton: {
      position: 'absolute',
      top: '30px',
      left: '30px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '10px',
      borderRadius: '50%',
      transition: 'background-color 0.3s',
    },
    backButtonHover: {
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    backIcon: {
      fontSize: '30px',
      color: '#4CAF50',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '600px',
    },
    breathingCircle: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      backgroundColor: '#90EE90',
      margin: '20px auto',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: isBreathing ? 'none' : 'transform 0.3s ease',
      transform: `scale(${scale})`,
    },
    instruction: {
      fontSize: '26px',
      color: '#4CAF50',
      fontWeight: 'bold',
      margin: '20px 0',
      textAlign: 'center',
      minHeight: '60px',
    },
    startButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '14px 28px',
      borderRadius: '30px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      margin: '10px 0',
    },
    historyToggle: {
      backgroundColor: 'transparent',
      color: '#4CAF50',
      border: '2px solid #4CAF50',
      padding: '10px 20px',
      borderRadius: '25px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '10px',
    },
    historyContainer: {
      marginTop: '30px',
      width: '100%',
      backgroundColor: '#f1f8e9',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    historyTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#4CAF50',
      margin: 0,
    },
    clearHistory: {
      backgroundColor: '#ff6b6b',
      color: 'white',
      border: 'none',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.3s',
    },
    tableContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #4CAF50',
      borderRadius: '5px',
      backgroundColor: 'white',
    },
    table: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    tableHeader: {
      display: 'flex',
      backgroundColor: '#4CAF50',
      color: 'white',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
    },
    tableRow: {
      display: 'flex',
      borderBottom: '1px solid #4CAF50',
    },
    tableCell: {
      flex: 1,
      padding: '12px',
      textAlign: 'center',
      fontSize: '16px',
    },
    headerCell: {
      flex: 1,
      padding: '12px',
      textAlign: 'center',
      fontSize: '16px',
      color: 'white',
    },
    emptyState: {
      padding: '30px',
      textAlign: 'center',
      color: '#999',
      fontSize: '16px',
    },
    // Media query styles (will be applied via JavaScript)
    mediaQueries: {
      '@media (max-width: 768px)': {
        breathingCircle: {
          width: '150px',
          height: '150px',
        },
        instruction: {
          fontSize: '22px',
        },
        startButton: {
          padding: '12px 24px',
          fontSize: '16px',
        },
        historyContainer: {
          padding: '15px',
        },
        tableCell: {
          padding: '8px',
          fontSize: '14px',
        },
        backButton: {
          top: '20px',
          left: '20px',
        },
        backIcon: {
          fontSize: '24px',
        },
      },
      '@media (max-width: 480px)': {
        breathingCircle: {
          width: '120px',
          height: '120px',
        },
        instruction: {
          fontSize: '20px',
        },
        historyTitle: {
          fontSize: '18px',
        },
        clearHistory: {
          padding: '4px 8px',
          fontSize: '12px',
        },
      },
    },
  };

  // Function to handle hover effects
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [isStartButtonHovered, setIsStartButtonHovered] = useState(false);
  const [isHistoryToggleHovered, setIsHistoryToggleHovered] = useState(false);
  const [isClearHistoryHovered, setIsClearHistoryHovered] = useState(false);

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.backButton,
          ...(isBackButtonHovered ? { backgroundColor: 'rgba(76, 175, 80, 0.1)' } : {})
        }}
        onMouseEnter={() => setIsBackButtonHovered(true)}
        onMouseLeave={() => setIsBackButtonHovered(false)}
        onClick={handleBack}
      >
        <span style={styles.backIcon}>←</span>
      </button>

      <div style={styles.content}>
        <div style={styles.breathingCircle} />
        
        <p style={styles.instruction}>{stageText()}</p>
        
        {!isBreathing && (
          <>
            <button
              style={{
                ...styles.startButton,
                ...(isStartButtonHovered ? {
                  backgroundColor: '#45a049',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)'
                } : {})
              }}
              onMouseEnter={() => setIsStartButtonHovered(true)}
              onMouseLeave={() => setIsStartButtonHovered(false)}
              onClick={startBreathing}
            >
              Start Breathing
            </button>
            
            <button
              style={{
                ...styles.historyToggle,
                ...(isHistoryToggleHovered ? {
                  backgroundColor: '#4CAF50',
                  color: 'white'
                } : {})
              }}
              onMouseEnter={() => setIsHistoryToggleHovered(true)}
              onMouseLeave={() => setIsHistoryToggleHovered(false)}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </>
        )}

        {showHistory && (
          <div style={styles.historyContainer}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>Breathing History</h3>
              {history.length > 0 && (
                <button
                  style={{
                    ...styles.clearHistory,
                    ...(isClearHistoryHovered ? { backgroundColor: '#ff5252' } : {})
                  }}
                  onMouseEnter={() => setIsClearHistoryHovered(true)}
                  onMouseLeave={() => setIsClearHistoryHovered(false)}
                  onClick={clearHistory}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div style={styles.tableContainer}>
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <div style={styles.headerCell}>Date</div>
                  <div style={styles.headerCell}>Time</div>
                </div>
                
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div key={index} style={styles.tableRow}>
                      <div style={styles.tableCell}>{item.date}</div>
                      <div style={styles.tableCell}>{item.time}</div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p>No history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add scrollbar styles via style tag */}
      <style>{`
        .table-container::-webkit-scrollbar {
          width: 8px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #4CAF50;
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #45a049;
        }
        
        @media (max-width: 768px) {
          .breathing-circle {
            width: 150px;
            height: 150px;
          }
          .instruction {
            font-size: 22px;
          }
        }
        
        @media (max-width: 480px) {
          .breathing-circle {
            width: 120px;
            height: 120px;
          }
          .instruction {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default TakeABreath;