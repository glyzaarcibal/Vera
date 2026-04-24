import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Wind, Moon, Sun, Heart, Timer, ArrowLeft, Settings2, Sparkles, Cloud } from "lucide-react";
import axiosInstance from "../../utils/axios.instance";

import "./TakeABreath.css";

// Audio imports
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

const TECHNIQUES = [
  { 
    id: "box", 
    name: "Box Breathing", 
    nameTl: "Paghingang Box",
    desc: "Equal duration inhale, hold, exhale, and hold for deep tactical calm.", 
    descTl: "Parehong tagal ng paghinga, pigil, at pagbuga para sa matinding kalmado.",
    pattern: "4-4-4-4",
    inhale: 4000, hold: 4000, exhale: 4000, holdAfter: 4000,
    icon: <LayoutGrid size={20} />,
    color: "#8b5cf6"
  },
  { 
    id: "478", 
    name: "4-7-8 Relaxation", 
    nameTl: "4-7-8 Relaksasyon",
    desc: "The 'Natural Tranquilizer' for the nervous system. Ideal for sleep prep.", 
    descTl: "Ang 'Natural na Pampakalma' para sa sistemang nerbyos. Mainam sa pagtulog.",
    pattern: "4-7-8",
    inhale: 4000, hold: 7000, exhale: 8000, holdAfter: 0,
    icon: <Wind size={20} />,
    color: "#7c3aed"
  },
  { 
    id: "deep-rest", 
    name: "Deep Rest", 
    nameTl: "Malalim na Pahinga",
    desc: "Extended exhales to signal your body to enter a parasympathetic state.", 
    descTl: "Mahabang pagbuga para senyasan ang katawan na pumasok sa malalim na pahinga.",
    pattern: "5-0-10",
    inhale: 5000, hold: 0, exhale: 10000, holdAfter: 0,
    icon: <Moon size={20} />,
    color: "#f472b6"
  }
];

const TEXTS = {
  English: {
    title: "Focus on your breath",
    subtitle: "Inhale as the circle expands, exhale as it contracts.",
    start: "Start Session",
    stop: "Stop Session",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    techniques: "Techniques",
    recent: "Recent Journeys",
    back: "Back",
    history: "Full History",
    noSessions: "No sessions yet."
  },
  Tagalog: {
    title: "Tumutok sa iyong paghinga",
    subtitle: "Huminga habang lumalaki ang bilog, ibuga habang lumiliit ito.",
    start: "Magsimula",
    stop: "Itigil",
    inhale: "Huminga",
    hold: "Pigil",
    exhale: "Ibuga",
    techniques: "Mga Teknik",
    recent: "Mga Nakaraang Session",
    back: "Bumalik",
    history: "Buong Kasaysayan",
    noSessions: "Wala pang session."
  }
};

const TakeABreath = () => {
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTechnique, setActiveTechnique] = useState(TECHNIQUES[1]); // 4-7-8 default
  const [isBreathing, setIsBreathing] = useState(false);
  const [stage, setStage] = useState("idle"); // idle, getReady, inhale, hold, exhale, holdAfter
  const [countdown, setCountdown] = useState(0);
  const [scale, setScale] = useState(1);
  const [history, setHistory] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [language, setLanguage] = useState("English");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const audioRefs = useRef({});
  const animationRef = useRef(null);
  const isBreathingRef = useRef(false);
  const timerRef = useRef(null);

  const t = TEXTS[language];

  useEffect(() => {
    isBreathingRef.current = isBreathing;
  }, [isBreathing]);

  useEffect(() => {
    loadHistory();
    preloadAudio();
    return () => {
      stopSession();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadHistory = async () => {
    if (!userId) return;
    try {
      const response = await axiosInstance.get("/activities");
      const historyItems = (response.data.activities || [])
        .filter(act => act.activity_type === "breath")
        .map(act => ({ id: act.id, ...act.data }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setHistory(historyItems);
    } catch (error) {
      console.error("Error loading breath history:", error);
    }
  };

  const preloadAudio = () => {
    Object.entries(AUDIO_SOURCES).forEach(([key, urls]) => {
      audioRefs.current[key] = new Audio(urls.english);
    });
  };

  const playAudio = (key) => {
    const audio = audioRefs.current[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio fail:", e));
    }
  };

  const startSession = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsBreathing(true);
    setStage("getReady");
    setCountdown(3);
    setSessionStartTime(new Date());
    
    playAudio('getReady');
    
    timerRef.current = setTimeout(() => {
      setCountdown(2);
      playAudio('countdown2');
      timerRef.current = setTimeout(() => {
        setCountdown(1);
        playAudio('countdown1');
        timerRef.current = setTimeout(() => {
          setCountdown(0);
          runBreathingCycle();
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const stopSession = () => {
    if (isBreathing && sessionStartTime) {
      saveHistory();
    }
    setIsBreathing(false);
    setStage("idle");
    setScale(1);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const runBreathingCycle = () => {
    let currentStage = "inhale";
    
    const nextStep = () => {
      if (!isBreathingRef.current) return;
      
      setStage(currentStage);
      let duration = 0;
      
      if (currentStage === "inhale") {
        playAudio("inhale");
        duration = activeTechnique.inhale;
        animateScale(1.5, duration);
        currentStage = activeTechnique.hold > 0 ? "hold" : "exhale";
      } else if (currentStage === "hold") {
        playAudio("hold");
        duration = activeTechnique.hold;
        currentStage = "exhale";
      } else if (currentStage === "exhale") {
        playAudio("exhale");
        duration = activeTechnique.exhale;
        animateScale(1, duration);
        currentStage = activeTechnique.holdAfter > 0 ? "holdAfter" : "inhale";
      } else if (currentStage === "holdAfter") {
        playAudio("hold");
        duration = activeTechnique.holdAfter;
        currentStage = "inhale";
      }
      
      timerRef.current = setTimeout(nextStep, duration);
    };
    
    nextStep();
  };

  const animateScale = (target, duration) => {
    const start = scale;
    const startTime = performance.now();
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const currentScale = start + (target - start) * ease;
      setScale(currentScale);
      
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const saveHistory = async () => {
    if (!userId || !sessionStartTime) return;
    const durationMins = Math.round((new Date() - sessionStartTime) / 60000);
    const newEntry = {
      technique: activeTechnique.name,
      duration: `${durationMins} mins`,
      timestamp: new Date().toISOString(),
      date: "Today"
    };
    
    try {
      const res = await axiosInstance.post("/activities/save", {
        activityType: "breath",
        data: newEntry
      });
      if (res.data?.updatedTokens) dispatch(updateTokens(res.data.updatedTokens));
      loadHistory();
    } catch (e) { console.error(e); }
  };

  const getStageDisplay = () => {
    if (stage === "getReady") return countdown;
    if (stage === "inhale") return t.inhale;
    if (stage === "hold" || stage === "holdAfter") return t.hold;
    if (stage === "exhale") return t.exhale;
    return "";
  };

  return (
    <div className="breath-container">
      
      {/* ── SIDEBAR ── */}
      <aside className="breath-sidebar">
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="nav-btn" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontWeight: '600' }}>
            <ArrowLeft size={18} /> {t.back}
          </button>
          <div className="language-toggle">
            <button 
              className={`lang-btn ${language === 'English' ? 'active' : ''}`}
              onClick={() => setLanguage('English')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === 'Tagalog' ? 'active' : ''}`}
              onClick={() => setLanguage('Tagalog')}
            >
              TL
            </button>
          </div>
        </header>

        <section className="sidebar-section">
          <h2>{t.techniques}</h2>
          <div className="technique-list">
            {TECHNIQUES.map(tech => (
              <div 
                key={tech.id} 
                className={`technique-card ${activeTechnique.id === tech.id ? 'active' : ''}`}
                onClick={() => setActiveTechnique(tech)}
              >
                <div className="card-header">
                  <div className="icon-box" style={{ background: `${tech.color}15`, color: tech.color }}>
                    {tech.icon}
                  </div>
                  <span className="badge" style={{ background: '#f3f4f6', color: '#6b7280' }}>{tech.pattern}</span>
                </div>
                <div className="card-content">
                  <h3>{language === 'Tagalog' ? tech.nameTl : tech.name}</h3>
                  <p>{language === 'Tagalog' ? tech.descTl : tech.desc}</p>
                </div>
                {activeTechnique.id === tech.id && (
                  <span className="badge" style={{ position: 'absolute', top: '20px', right: '20px', background: '#7c3aed', color: 'white' }}>ACTIVE</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="sidebar-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>{t.recent}</h2>
            <button onClick={() => setShowHistoryModal(true)} className="view-all-btn">{t.history}</button>
          </div>
          <div className="journey-list">
            {history.length > 0 ? history.slice(0, 3).map((item, i) => (
              <div key={i} className="journey-item">
                <div className="journey-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  {item.technique?.includes('Sleep') || item.technique?.includes('Rest') ? <Moon size={18} /> : <Cloud size={18} />}
                </div>
                <div className="journey-info">
                  <span className="journey-name">{item.technique}</span>
                  <span className="journey-meta">{item.date} • {item.duration}</span>
                </div>
                <span className="journey-badge">DEEP</span>
              </div>
            )) : <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{t.noSessions}</p>}
          </div>
        </section>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="breath-main">
        <header className="main-header">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>{t.title}</motion.h1>
          <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {t.subtitle}
          </motion.p>
        </header>

        <div className="circle-container">
          <div className="outer-glow" />
          <motion.div 
            className="breathing-circle"
            style={{ transform: `scale(${scale})` }}
          >
            {getStageDisplay()}
          </motion.div>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <Timer size={18} color="#9ca3af" /> 10:00
          </div>
          <div className="stat-item">
            <Heart size={18} color="#ef4444" /> 72 BPM
          </div>
        </div>

        <button 
          className="start-btn" 
          onClick={isBreathing ? stopSession : startSession}
        >
          {isBreathing ? t.stop : t.start}
        </button>

        <div className="customize-link">
          <Settings2 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Customize Technique
        </div>
      </main>

      {/* ── HISTORY MODAL ── */}
      <AnimatePresence>
        {showHistoryModal && (
          <ModalPortal>
            <motion.div 
              className="history-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
            >
              <motion.div 
                className="history-modal-content"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>{t.history}</h2>
                  <button className="close-modal" onClick={() => setShowHistoryModal(false)}>×</button>
                </div>
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Technique</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((log, i) => (
                        <tr key={i}>
                          <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                          <td>{log.technique}</td>
                          <td>{log.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TakeABreath;