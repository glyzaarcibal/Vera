import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import axiosInstance from "../../utils/axios.instance";
import { motion, AnimatePresence } from "framer-motion";
import TokenRewardModal from "../../components/TokenRewardModal";
import veraIcon from "../../assets/icon.png";

// ── Emotions Data ────────────────────────────────────────────────
const EMOTIONS = [
  { id: 1, icon: "🧘", name: "Calm", color: "#A5B4FC", affirmation: "Peace begins with a deep breath." },
  { id: 2, icon: "😊", name: "Joy", color: "#FDE68A", affirmation: "Your happiness is a beautiful gift." },
  { id: 3, icon: "🕊️", name: "Peace", color: "#93C5FD", affirmation: "Everything is unfolding as it should." },
  { id: 4, icon: "💖", name: "Love", color: "#F9A8D4", affirmation: "You are worthy of love and kindness." },
  { id: 5, icon: "✨", name: "Hope", color: "#C4B5FD", affirmation: "Better days are always ahead." },
  { id: 6, icon: "🌈", name: "Grateful", color: "#6EE7B7", affirmation: "Focus on the blessings around you." },
  { id: 7, icon: "🧸", name: "Secure", color: "#FCA5A5", affirmation: "You are safe and protected." },
  { id: 8, icon: "🌱", name: "Growth", color: "#86EFAC", affirmation: "Every step forward is a victory." },
  { id: 9, icon: "🌊", name: "Flow", color: "#7DD3FC", affirmation: "Go with the rhythm of your heart." },
  { id: 10, icon: "☀️", name: "Radiant", color: "#FDBA74", affirmation: "Your light shines from within." },
  { id: 11, icon: "🌙", name: "Serene", color: "#818CF8", affirmation: "Night brings rest and renewal." },
  { id: 12, icon: "🧠", name: "Mindful", color: "#D1D5DB", affirmation: "Be present in this very moment." },
  { id: 13, icon: "💪", name: "Stong", color: "#94A3B8", affirmation: "Your strength is greater than any challenge." },
  { id: 14, icon: "🎋", name: "Flexibility", color: "#A7F3D0", affirmation: "Bend, but do not break." },
  { id: 15, icon: "🐚", name: "Inner Voice", color: "#E9D5FF", affirmation: "Listen to the wisdom inside you." },
];

const MODES = {
  ZEN: { name: "Zen Mode", grid: { rows: 3, cols: 4 }, timer: null, description: "Match to reveal daily affirmations.", color: "#6c63ff" },
  FOCUS: { name: "Focus Mode", grid: { rows: 4, cols: 4 }, timer: 60, description: "Match all cards before time runs out.", color: "#3b82f6" },
  CHALLENGE: { name: "Vera's Challenge", grid: { rows: 5, cols: 6 }, timer: 90, description: "Cards may shuffle if you take too long!", color: "#f43f5e" }
};

// ── Helpers ─────────────────────────────────────────────────────
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const generateCards = (mode) => {
  const { rows, cols } = mode.grid;
  const numPairs = (rows * cols) / 2;
  const selectedEmotions = EMOTIONS.slice(0, numPairs);
  const cards = [...selectedEmotions, ...selectedEmotions].map((emotion, index) => ({
    uniqueId: index,
    ...emotion,
    matched: false,
    flipped: false,
  }));
  return shuffle(cards);
};

// ── Components ──────────────────────────────────────────────────
const Card = ({ card, onClick, isActive }) => (
  <motion.button
    layout
    onClick={() => onClick(card)}
    disabled={card.matched || !isActive}
    className="emotion-card"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileHover={!card.matched && isActive ? { scale: 1.05 } : {}}
    whileTap={!card.matched && isActive ? { scale: 0.95 } : {}}
    style={{
      backgroundColor: card.matched || card.flipped ? card.color : "#fff",
      borderColor: card.matched ? "#fbbf24" : "rgba(108, 99, 255, 0.1)",
    }}
  >
    <AnimatePresence mode="wait">
      {card.matched || card.flipped ? (
        <motion.div
          key="front"
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 180, opacity: 0 }}
          className="card-content"
        >
          <span className="card-icon">{card.icon}</span>
          <span className="card-name">{card.name}</span>
        </motion.div>
      ) : (
        <motion.div
           key="back"
           initial={{ rotateY: -180, opacity: 0 }}
           animate={{ rotateY: 0, opacity: 1 }}
           exit={{ rotateY: -180, opacity: 0 }}
           className="card-back"
        >
           <img src={veraIcon} alt="Vera" className="card-back-icon" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

const ClipCardGame = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("menu"); // menu, playing, won, lost
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [lastShuffleTime, setLastShuffleTime] = useState(Date.now());
  const [showRewardModal, setShowRewardModal] = useState(false);

  // Initialization
  const startGame = (selectedMode) => {
    const newCards = generateCards(selectedMode);
    setMode(selectedMode);
    setCards(newCards);
    setSelected([]);
    setScore(0);
    setTimer(selectedMode.timer || 0);
    setGameStatus("playing");
    setCurrentAffirmation("");
    setLastShuffleTime(Date.now());
  };

  // Logic: Timer
  useEffect(() => {
    let interval;
    if (gameStatus === "playing" && mode?.timer) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setGameStatus("lost");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, mode]);

  // Logic: Challenge Mode Shuffle
  useEffect(() => {
    if (gameStatus === "playing" && mode?.name === "Vera's Challenge") {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - lastShuffleTime > 8000) { // Every 8 seconds
          setCards(prev => {
            const unmatched = prev.filter(c => !c.matched);
            const matched = prev.filter(c => c.matched);
            const shuffledUnmatched = shuffle(unmatched);
            return [...matched, ...shuffledUnmatched];
          });
          setLastShuffleTime(now);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus, mode, lastShuffleTime]);

  // Logic: Matching
  const handleCardClick = (card) => {
    if (selected.length === 2 || card.flipped || card.matched) return;

    const newCards = cards.map(c => 
      c.uniqueId === card.uniqueId ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    const newSelected = [...selected, card];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => checkMatch(newSelected), 600);
    }
  };

  const checkMatch = (selection) => {
    const [c1, c2] = selection;
    if (c1.id === c2.id) {
      // Success!
      setCards(prev => prev.map(c => 
        c.id === c1.id ? { ...c, matched: true, flipped: true } : c
      ));
      setScore(s => s + 50);
      setCurrentAffirmation(c1.affirmation);
      speakText(c1.name); // Say the emotion name
      setSelected([]);
    } else {
      // Fail
      setCards(prev => prev.map(c => 
        (c.uniqueId === c1.uniqueId || c.uniqueId === c2.uniqueId) 
          ? { ...c, flipped: false } : c
      ));
      setSelected([]);
    }
  };

  // Check for Win
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setGameStatus("won");
      saveGameActivity();
    }
  }, [cards]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const saveGameActivity = async () => {
    try {
      const res = await axiosInstance.post("/activities/save", {
        activityType: "clipcard",
        data: { score, mode: mode.name, timestamp: new Date().toISOString() }
      });
      if (res.data?.updatedTokens) {
        dispatch(updateTokens(res.data.updatedTokens));
        setShowRewardModal(true);
      }
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  return (
    <div className="emotion-game-container">
      <style>{`
        .emotion-game-container {
          min-height: 100vh;
          background: #f8f9ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .game-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .header-spacer { width: 80px; }
        @media (max-width: 640px) { .header-spacer { width: 45px; } }

        .game-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          text-align: center;
          flex: 1;
        }

        .game-title em { color: #6c63ff; font-style: normal; }

        .game-menu {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          width: 100%;
          max-width: 1000px;
          margin-top: 4rem;
        }

        .mode-card {
          background: white;
          padding: 2.5rem;
          border-radius: 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          text-align: center;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .mode-card:hover { transform: translateY(-10px); border-color: #6c63ff; }

        .mode-card h2 { margin-bottom: 0.5rem; color: #1e293b; }
        .mode-card p { color: #64748b; font-size: 0.9rem; }

        .game-field-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .game-stats-bar {
          display: flex;
          gap: 3rem;
          background: white;
          padding: 1rem 3rem;
          border-radius: 100px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }

        .stat-box { display: flex; flex-direction: column; align-items: center; }
        .stat-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }

        .cards-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-items: center;
        }

        @media (max-width: 640px) {
          .emotion-game-container { padding: 0.75rem 0.5rem; overflow-x: hidden; }
          .game-title { font-size: 1.25rem; }
          .emotion-card { 
            width: auto; 
            aspect-ratio: 1 / 1; 
            max-width: calc((100vw - 2rem) / ${mode?.grid?.cols || 4} - 4px);
            min-width: 0;
            border-radius: 10px; 
            border-width: 1px; 
            height: auto;
          }
          .card-icon { font-size: 1.25rem; }
          .card-name { display: none; } /* Hide names on mobile to save height space */
          .game-stats-bar { gap: 0.5rem; padding: 0.5rem; margin-bottom: 1rem; width: 100%; justify-content: space-around; }
          .stat-value { font-size: 0.85rem; }
          .stat-label { font-size: 0.5rem; }
          .cards-grid { gap: 0.25rem; padding: 0.25rem; width: 100%; max-width: 100%; justify-content: center; }
          .card-back-icon { width: 100%; height: 100%; }
        }

        .emotion-card {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s;
          padding: 0;
          overflow: hidden;
        }

        .card-content { display: flex; flex-direction: column; align-items: center; }
        .card-icon { font-size: 2rem; }
        .card-name { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; margin-top: 4px; }

        .card-back {
          background: #6c63ff;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: hidden;
        }

        .card-back-icon {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        }

        .affirmation-toast {
          position: fixed;
          bottom: 4rem;
          background: #1e293b;
          color: white;
          padding: 1rem 2rem;
          border-radius: 100px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          font-weight: 600;
          z-index: 100;
        }

        .win-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .back-btn {
          border: none;
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
          cursor: pointer;
        }
      `}</style>

      <div className="game-header">
        <button className="back-btn" onClick={() => navigate("/activities")}>
          {windowWidth <= 640 ? "←" : "← Back"}
        </button>
        <h1 className="game-title">Emotion <em>Match</em></h1>
        <div className="header-spacer" />
      </div>

      <AnimatePresence mode="wait">
        {gameStatus === "menu" && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="game-menu"
          >
            {Object.values(MODES).map(m => (
              <div key={m.name} className="mode-card" onClick={() => startGame(m)}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {m.name === "Zen Mode" ? "🧘" : m.name === "Focus Mode" ? "⚡" : "🔥"}
                </div>
                <h2>{m.name}</h2>
                <p>{m.description}</p>
                <div style={{ marginTop: '1.5rem', fontWeight: 700, color: m.color }}>
                  {m.grid.rows}x{m.grid.cols} Grid
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {gameStatus === "playing" && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="game-field-wrapper"
          >
            <div className="game-stats-bar">
              <div className="stat-box">
                <span className="stat-label">Mode</span>
                <span className="stat-value">{mode.name}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Score</span>
                <span className="stat-value">{score}</span>
              </div>
              {mode.timer && (
                <div className="stat-box">
                  <span className="stat-label">Time</span>
                  <span className="stat-value" style={{ color: timer < 10 ? '#ef4444' : 'inherit' }}>
                    {timer}s
                  </span>
                </div>
              )}
            </div>

            <div className="cards-grid" style={{ 
              gridTemplateColumns: `repeat(${mode.grid.cols}, 1fr)`,
              width: '100%',
              maxWidth: '500px'
            }}>
              {cards.map(card => (
                <Card 
                  key={card.uniqueId} 
                  card={card} 
                  onClick={handleCardClick}
                  isActive={selected.length < 2 && gameStatus === "playing"}
                />
              ))}
            </div>

            <AnimatePresence>
              {currentAffirmation && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="affirmation-toast"
                >
                  {currentAffirmation}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {gameStatus === "won" && (
          <motion.div 
            key="win"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="win-overlay"
          >
            <div style={{ fontSize: '5rem' }}>🏆</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>Splendid Work!</h1>
            <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2rem' }}>
              You matched them all and earned <strong>{score}</strong> Mindfulness Points.
            </p>
            <button className="mode-card" style={{ padding: '1rem 3rem' }} onClick={() => setGameStatus("menu")}>
              Play Again
            </button>
          </motion.div>
        )}

        {gameStatus === "lost" && (
          <motion.div 
            key="lost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="win-overlay"
          >
            <div style={{ fontSize: '5rem' }}>⏰</div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>Time's Up!</h1>
            <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '2rem' }}>
              Don't worry, every journey has its own pace.
            </p>
            <button className="mode-card" style={{ padding: '1rem 3rem' }} onClick={() => setGameStatus("menu")}>
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <TokenRewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)}
        amount={5}
        message="Amazing focus! You've matched all the cards and earned your tokens. Your brain is getting sharper every day!"
      />
    </div>
  );
};

export default ClipCardGame;