import React, { useState, useEffect, useRef } from "react";

// Audio from src/assets/breath/ (Vite bundles these and gives correct URLs)
import getReadyEn from "../../assets/breath/get-ready-in.mp3";
import getReadyTl from "../../assets/breath/humandakasabilang.mp3";
import inhaleEn from "../../assets/breath/inhale.mp3";
import inhaleTl from "../../assets/breath/huminga.mp3";
import exhaleEn from "../../assets/breath/exhale.mp3";
import exhaleTl from "../../assets/breath/huminganangpalabas.mp3";
import holdEn from "../../assets/breath/hold.mp3";
import holdTl from "../../assets/breath/Pigil.mp3";
import countdown3En from "../../assets/breath/countdown3.mp3";
import countdown3Tl from "../../assets/breath/countdown3tagalog.mp3";
import countdown2En from "../../assets/breath/countdown2.mp3";
import countdown2Tl from "../../assets/breath/countdown2tagalog.mp3";
import countdown1En from "../../assets/breath/countdown1.mp3";
import countdown1Tl from "../../assets/breath/countdown1tagalog.mp3";

const AUDIO_SOURCES = {
  getReady: { english: getReadyEn, tagalog: getReadyTl },
  inhale: { english: inhaleEn, tagalog: inhaleTl },
  exhale: { english: exhaleEn, tagalog: exhaleTl },
  hold: { english: holdEn, tagalog: holdTl },
  countdown3: { english: countdown3En, tagalog: countdown3Tl },
  countdown2: { english: countdown2En, tagalog: countdown2Tl },
  countdown1: { english: countdown1En, tagalog: countdown1Tl },
};

const BREATHING_TYPES = [
  { id: "relaxing", name: "Relaxing (6-7-8)", nameTl: "Relaks (6-7-8)", inhaleMs: 6000, holdMs: 7000, exhaleMs: 8000 },
  { id: "box", name: "Box (4-4-4)", nameTl: "Box (4-4-4)", inhaleMs: 4000, holdMs: 4000, exhaleMs: 4000 },
  { id: "478", name: "4-7-8 Calm", nameTl: "4-7-8 Kalmado", inhaleMs: 4000, holdMs: 7000, exhaleMs: 8000 },
  { id: "calm", name: "Calm (4-2-6)", nameTl: "Kalmado (4-2-6)", inhaleMs: 4000, holdMs: 2000, exhaleMs: 6000 },
];

const TEXTS = {
  English: {
    getReady: "Get ready...",
    inhale: "Inhale...",
    hold: "Hold...",
    exhale: "Exhale...",
    startBreathing: "Start Breathing",
    showHistory: "Show History",
    hideHistory: "Hide History",
    breathingHistory: "Breathing History",
    clearAll: "Clear All",
    noHistory: "No history yet",
    date: "Date",
    time: "Time",
    type: "Type",
    chooseType: "Choose breathing type",
  },
  Tagalog: {
    getReady: "Handa na...",
    inhale: "Huminga papasok...",
    hold: "Pigil...",
    exhale: "Huminga palabas...",
    startBreathing: "Magsimula ng Paghinga",
    showHistory: "Ipakita ang Kasaysayan",
    hideHistory: "Itago ang Kasaysayan",
    breathingHistory: "Kasaysayan ng Paghinga",
    clearAll: "Burahin Lahat",
    noHistory: "Wala pang kasaysayan",
    date: "Petsa",
    time: "Oras",
    type: "Uri",
    chooseType: "Pumili ng uri ng paghinga",
  },
};

const TakeABreath = () => {
  const [breathingStage, setBreathingStage] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState([]);
  const [scale, setScale] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [language, setLanguage] = useState("English");
  const [breathType, setBreathType] = useState(BREATHING_TYPES[0].id);
  const animationRef = useRef(null);
  const audioRefs = useRef({});
  const audioContextRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    preloadAudio();
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio && audio.pause) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, [language]);

  useEffect(() => {
    if (!isBreathing || countdown > 0) return;

    const preset = BREATHING_TYPES.find((p) => p.id === breathType) || BREATHING_TYPES[0];
    let timing = 0;

    if (breathingStage === 0) {
      playAudio("inhale");
      animateBreath(1.5, preset.inhaleMs);
      timing = preset.inhaleMs;
    } else if (breathingStage === 1) {
      playAudio("hold");
      timing = preset.holdMs;
    } else if (breathingStage === 2) {
      playAudio("exhale");
      animateBreath(1, preset.exhaleMs);
      timing = preset.exhaleMs;
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
    breathType,
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
    const isTagalog = language === "Tagalog";
    Object.entries(AUDIO_SOURCES).forEach(([key, urls]) => {
      const src = isTagalog ? urls.tagalog : urls.english;
      const audio = new Audio(src);
      audio.preload = "auto";
      audioRefs.current[key] = audio;
    });
  };

  const playFallbackSound = (type = "tone") => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(type === "inhale" ? 220 : type === "exhale" ? 180 : 440, ctx.currentTime);
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log("Fallback sound skipped:", e);
    }
  };

  const playAudio = (audioKey) => {
    try {
      const audio = audioRefs.current[audioKey];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch((e) => {
          console.warn("Audio play failed, using fallback:", e);
          playFallbackSound(audioKey === "inhale" ? "inhale" : audioKey === "exhale" ? "exhale" : "tone");
        });
      } else {
        playFallbackSound();
      }
    } catch (error) {
      console.warn("playAudio error:", error);
      playFallbackSound();
    }
  };

  const addHistory = async () => {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const preset = BREATHING_TYPES.find((p) => p.id === breathType) || BREATHING_TYPES[0];
    const typeLabel = language === "Tagalog" ? preset.nameTl : preset.name;
    const newHistory = [
      { session: history.length + 1, date, time, type: breathType, typeLabel },
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
        const parsed = JSON.parse(savedHistory);
        const withType = parsed.map((entry) => ({
          ...entry,
          type: entry.type || "relaxing",
          typeLabel: entry.typeLabel || (language === "Tagalog" ? "Relaks (6-7-8)" : "Relaxing (6-7-8)"),
        }));
        setHistory(withType.sort((a, b) => (b.session || 0) - (a.session || 0)));
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

  const t = TEXTS[language] || TEXTS.English;
  const stageText = () => {
    if (!isBreathing) return "";
    if (countdown > 0) return `${t.getReady} ${countdown}`;
    return [t.inhale, t.hold, t.exhale][breathingStage] || "";
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
        {!isBreathing && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => setLanguage("English")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: language === "English" ? "2px solid #4CAF50" : "1px solid #ccc",
                background: language === "English" ? "#4CAF50" : "#fff",
                color: language === "English" ? "#fff" : "#333",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("Tagalog")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: language === "Tagalog" ? "2px solid #4CAF50" : "1px solid #ccc",
                background: language === "Tagalog" ? "#4CAF50" : "#fff",
                color: language === "Tagalog" ? "#fff" : "#333",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Tagalog
            </button>
          </div>
        )}
        <div style={styles.breathingCircle} />
        <p style={styles.instruction}>{stageText()}</p>
        {!isBreathing && (
          <>
            <p style={{ marginBottom: 8, fontWeight: 600, color: "#2E7D32", fontSize: 14 }}>
              {t.chooseType}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {BREATHING_TYPES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setBreathType(preset.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: breathType === preset.id ? "2px solid #4CAF50" : "1px solid #ccc",
                    background: breathType === preset.id ? "#4CAF50" : "#fff",
                    color: breathType === preset.id ? "#fff" : "#333",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {language === "Tagalog" ? preset.nameTl : preset.name}
                </button>
              ))}
            </div>
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
              {t.startBreathing}
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
              {showHistory ? t.hideHistory : t.showHistory}
            </button>
          </>
        )}

        {showHistory && (
          <div style={styles.historyContainer}>
            <div style={styles.historyHeader}>
              <h3 style={styles.historyTitle}>{t.breathingHistory}</h3>
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
                  {t.clearAll}
                </button>
              )}
            </div>
            
            <div style={styles.tableContainer}>
              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <div style={styles.headerCell}>{t.date}</div>
                  <div style={styles.headerCell}>{t.time}</div>
                  <div style={styles.headerCell}>{t.type}</div>
                </div>
                
                {history.length > 0 ? (
                  history.map((item, index) => {
                    const typeLabel = item.typeLabel || (() => {
                      const p = BREATHING_TYPES.find((x) => x.id === (item.type || "relaxing"));
                      return p ? (language === "Tagalog" ? p.nameTl : p.name) : (item.type || "—");
                    })();
                    return (
                      <div key={index} style={styles.tableRow}>
                        <div style={styles.tableCell}>{item.date}</div>
                        <div style={styles.tableCell}>{item.time}</div>
                        <div style={styles.tableCell}>{typeLabel}</div>
                      </div>
                    );
                  })
                ) : (
                  <div style={styles.emptyState}>
                    <p>{t.noHistory}</p>
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