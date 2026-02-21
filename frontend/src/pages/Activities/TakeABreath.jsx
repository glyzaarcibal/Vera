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

  // Function to handle hover effects
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [isStartButtonHovered, setIsStartButtonHovered] = useState(false);
  const [isHistoryToggleHovered, setIsHistoryToggleHovered] = useState(false);
  const [isClearHistoryHovered, setIsClearHistoryHovered] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)",
        padding: "20px",
        fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
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
          
          .table-container::-webkit-scrollbar {
            width: 8px;
          }
          .table-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .table-container::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 4px;
          }
          .table-container::-webkit-scrollbar-thumb:hover {
            background: #5a67d8;
          }
        `}
      </style>

      <button
        style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          background: 'white',
          border: 'none',
          cursor: 'pointer',
          padding: '10px',
          borderRadius: '50%',
          transition: 'all 0.3s',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#667eea',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          transform: isBackButtonHovered ? 'scale(1.1)' : 'scale(1)',
          zIndex: 20,
        }}
        onMouseEnter={() => setIsBackButtonHovered(true)}
        onMouseLeave={() => setIsBackButtonHovered(false)}
        onClick={handleBack}
      >
        ←
      </button>

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 40px)',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '30px',
          padding: '30px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          width: '100%',
        }}>
          {!isBreathing && (
            <div style={{ 
              display: "flex", 
              gap: "8px", 
              marginBottom: "16px",
              justifyContent: "center",
            }}>
              <button
                type="button"
                onClick={() => setLanguage("English")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: language === "English" ? "2px solid #667eea" : "1px solid #ccc",
                  background: language === "English" ? "#667eea" : "#fff",
                  color: language === "English" ? "#fff" : "#333",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: 'all 0.2s',
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
                  border: language === "Tagalog" ? "2px solid #667eea" : "1px solid #ccc",
                  background: language === "Tagalog" ? "#667eea" : "#fff",
                  color: language === "Tagalog" ? "#fff" : "#333",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: 'all 0.2s',
                }}
              >
                Tagalog
              </button>
            </div>
          )}

          <h1 style={{
            fontSize: "32px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 30px 0",
            fontWeight: "bold",
            textAlign: "center",
          }}>
            Take a Breath 🧘
          </h1>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              margin: '20px auto',
              boxShadow: isBreathing ? `0 20px 40px rgba(102, 126, 234, 0.4)` : '0 10px 30px rgba(0,0,0,0.1)',
              transition: isBreathing ? 'none' : 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: `scale(${scale})`,
            }} />
            
            <p style={{
              fontSize: '28px',
              color: '#667eea',
              fontWeight: 'bold',
              margin: '20px 0',
              textAlign: 'center',
              minHeight: '60px',
            }}>
              {stageText()}
            </p>

            {!isBreathing && (
              <>
                <p style={{ 
                  marginBottom: 8, 
                  fontWeight: 600, 
                  color: "#667eea", 
                  fontSize: 14 
                }}>
                  {t.chooseType}
                </p>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 8, 
                  justifyContent: "center", 
                  marginBottom: 12 
                }}>
                  {BREATHING_TYPES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBreathType(preset.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: breathType === preset.id ? "2px solid #667eea" : "1px solid #ccc",
                        background: breathType === preset.id ? "#667eea" : "#fff",
                        color: breathType === preset.id ? "#fff" : "#333",
                        fontWeight: 500,
                        cursor: "pointer",
                        fontSize: 13,
                        transition: 'all 0.2s',
                      }}
                    >
                      {language === "Tagalog" ? preset.nameTl : preset.name}
                    </button>
                  ))}
                </div>

                <button
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 28px',
                    borderRadius: '30px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: isStartButtonHovered 
                      ? '0 15px 30px rgba(102, 126, 234, 0.4)' 
                      : '0 10px 20px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    margin: '10px 0',
                    transform: isStartButtonHovered ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                  onMouseEnter={() => setIsStartButtonHovered(true)}
                  onMouseLeave={() => setIsStartButtonHovered(false)}
                  onClick={startBreathing}
                >
                  {t.startBreathing}
                </button>

                <button
                  style={{
                    background: isHistoryToggleHovered 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                    color: isHistoryToggleHovered ? 'white' : '#667eea',
                    border: '2px solid #667eea',
                    padding: '10px 20px',
                    borderRadius: '25px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginTop: '10px',
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
              <div style={{
                marginTop: '30px',
                width: '100%',
                background: 'rgba(241, 248, 233, 0.3)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: 0,
                  }}>
                    {t.breathingHistory}
                  </h3>
                  {history.length > 0 && (
                    <button
                      style={{
                        background: isClearHistoryHovered ? '#ff5252' : '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={() => setIsClearHistoryHovered(true)}
                      onMouseLeave={() => setIsClearHistoryHovered(false)}
                      onClick={clearHistory}
                    >
                      {t.clearAll}
                    </button>
                  )}
                </div>
                
                <div className="table-container" style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #667eea',
                  borderRadius: '5px',
                  background: 'white',
                }}>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      display: 'flex',
                      background: '#667eea',
                      color: 'white',
                      fontWeight: 'bold',
                      position: 'sticky',
                      top: 0,
                    }}>
                      <div style={styles.tableHeaderCell}>{t.date}</div>
                      <div style={styles.tableHeaderCell}>{t.time}</div>
                      <div style={styles.tableHeaderCell}>{t.type}</div>
                    </div>
                    
                    {history.length > 0 ? (
                      history.map((item, index) => {
                        const typeLabel = item.typeLabel || (() => {
                          const p = BREATHING_TYPES.find((x) => x.id === (item.type || "relaxing"));
                          return p ? (language === "Tagalog" ? p.nameTl : p.name) : (item.type || "—");
                        })();
                        return (
                          <div key={index} style={{
                            display: 'flex',
                            borderBottom: '1px solid #667eea',
                          }}>
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
        </div>
      </div>
    </div>
  );
};

const styles = {
  tableHeaderCell: {
    flex: 1,
    padding: '12px',
    textAlign: 'center',
    fontSize: '16px',
    color: 'white',
  },
  tableCell: {
    flex: 1,
    padding: '12px',
    textAlign: 'center',
    fontSize: '16px',
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
  },
};

export default TakeABreath;