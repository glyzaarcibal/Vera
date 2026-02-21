import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const icons = [
  { icon: "🐰", name: "bunny", color: "#FFB6C1" },
  { icon: "🐻", name: "bear", color: "#8B4513" },
  { icon: "🦊", name: "fox", color: "#FF4500" },
  { icon: "🐼", name: "panda", color: "#2E2E2E" },
  { icon: "🐱", name: "cat", color: "#FFA07A" },
  { icon: "🐶", name: "dog", color: "#D2691E" },
  { icon: "🐵", name: "monkey", color: "#8B5A2B" },
  { icon: "🐸", name: "frog", color: "#32CD32" },
  { icon: "🐯", name: "tiger", color: "#FF6347" },
  { icon: "🐹", name: "hamster", color: "#DEB887" },
];

const quotes = [
  "You're pawsome! 🐾 Keep going! ✨",
  "Cuteness overload! You're amazing! 💖",
  "Wow! You have the heart of a panda! 🐼💪",
  "You're as clever as a fox! 🦊 Keep it up! 🚀",
  "Great job! You're on fire! 🔥 Keep pushing! 🏆",
  "Purrfect match! You're on a roll! 🐱",
  "You're hopping to success! 🐰",
  "Bear-y good job! 🐻",
];

let winnerAudio;

const generateCards = (level) => {
  const numPairs = 2 + (level - 1) * 2;
  const selectedIcons = icons.slice(0, numPairs);
  const cards = [...selectedIcons, ...selectedIcons].map((content, index) => ({
    id: index + 1,
    content,
    matched: false,
    flipped: false,
  }));
  return shuffleCards(cards);
};

const shuffleCards = (cards) => [...cards].sort(() => Math.random() - 0.5);

const playSound = (soundFile) => {
  const audio = new Audio(soundFile);
  audio.volume = 0.5;
  audio.play().catch(e => console.log("Audio play failed:", e));
  return audio;
};

const Card = ({ card, onClick, isDisabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onClick(card)}
      disabled={card.matched || isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100px",
        height: "100px",
        background: card.matched 
          ? `linear-gradient(135deg, ${card.content.color}40, ${card.content.color}20)`
          : card.flipped
          ? `linear-gradient(135deg, ${card.content.color}, ${card.content.color}dd)`
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        justifyContent: "center",
        alignItems: "center",
        margin: "8px",
        borderRadius: "20px",
        border: card.matched ? "3px solid #FFD700" : "none",
        cursor: (card.matched || isDisabled) ? "default" : "pointer",
        opacity: isDisabled && !card.flipped && !card.matched ? 0.7 : 1,
        boxShadow: isHovered && !card.matched && !card.flipped && !isDisabled
          ? "0 10px 20px rgba(102, 126, 234, 0.4)"
          : card.matched
          ? "0 5px 15px rgba(255, 215, 0, 0.3)"
          : card.flipped
          ? `0 10px 20px ${card.content.color}80`
          : "0 5px 15px rgba(0,0,0,0.2)",
        display: "flex",
        fontSize: card.matched || card.flipped ? "36px" : "24px",
        color: "#fff",
        transform: isHovered && !card.matched && !card.flipped && !isDisabled
          ? "scale(1.05) translateY(-5px)" 
          : card.flipped
          ? "scale(1.02)"
          : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        animation: card.matched ? "pulse 1.5s infinite" : "none",
      }}
    >
      {/* Shine effect on hover */}
      {isHovered && !card.matched && !card.flipped && !isDisabled && (
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
            transform: "rotate(45deg)",
            animation: "shine 1.5s infinite",
            pointerEvents: "none",
          }}
        />
      )}
      
      {card.matched || card.flipped ? card.content.icon : "❓"}
      
      {/* Floating particles for matched cards */}
      {card.matched && (
        <>
          <span style={styles.particle1}>✨</span>
          <span style={styles.particle2}>⭐</span>
          <span style={styles.particle3}>💫</span>
        </>
      )}
    </button>
  );
};

const ClipCardGame = () => {
  const navigate = useNavigate();
  
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState(generateCards(level));
  const [selectedCards, setSelectedCards] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [motivationQuote, setMotivationQuote] = useState("");
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (selectedCards.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);
      const [first, second] = selectedCards;
      
      if (first.content.icon === second.content.icon) {
        // Match found
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.content.icon === first.content.icon 
              ? { ...card, matched: true } 
              : card
          )
        );
        setScore(prev => prev + 10 * level);
        playSound("/audio/ting.mp3");
        setSelectedCards([]);
        setIsChecking(false);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === first.id || card.id === second.id
                ? { ...card, flipped: false }
                : card
            )
          );
          setSelectedCards([]);
          setIsChecking(false);
        }, 800); // 800ms delay before flipping back
      }
    }
  }, [selectedCards, level]);

  useEffect(() => {
    if (cards.every((card) => card.matched)) {
      setGameOver(true);
      setShowConfetti(true);
      setMotivationQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      const audio = playSound("/audio/winner.mp3");
      winnerAudio = audio;
      setIsTimerActive(false);
      
      // Add bonus time score
      setScore(prev => prev + timeLeft * 5);
      
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [cards, timeLeft]);

  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0 && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, gameOver]);

  const handleCardClick = (card) => {
    if (
      !gameOver &&
      !isChecking &&
      selectedCards.length < 2 &&
      !card.flipped &&
      !card.matched
    ) {
      if (!isTimerActive) setIsTimerActive(true);
      
      setCards((prevCards) =>
        prevCards.map((c) => (c.id === card.id ? { ...c, flipped: true } : c))
      );
      setSelectedCards([...selectedCards, card]);
      playSound("/audio/tap2.mp3");
    }
  };

  const nextLevel = () => {
    if (winnerAudio) {
      winnerAudio.pause();
      winnerAudio.currentTime = 0;
    }
    if (level < 5) {
      setLevel(level + 1);
      setCards(generateCards(level + 1));
      setSelectedCards([]);
      setGameOver(false);
      setMotivationQuote("");
      setMoves(0);
      setTimeLeft(60 + (level * 10));
      setIsTimerActive(false);
      setIsChecking(false);
    } else {
      resetGame();
    }
  };

  const resetGame = () => {
    if (winnerAudio) {
      winnerAudio.pause();
      winnerAudio.currentTime = 0;
    }
    setLevel(1);
    setCards(generateCards(1));
    setSelectedCards([]);
    setGameOver(false);
    setMotivationQuote("");
    setMoves(0);
    setScore(0);
    setTimeLeft(60);
    setIsTimerActive(false);
    setShowConfetti(false);
    setIsChecking(false);
  };

  const progress = (cards.filter(c => c.matched).length / cards.length) * 100;

  const getLevelEmoji = (level) => {
    const emojis = ["🌱", "🌿", "🍃", "🌳", "🌟"];
    return emojis[level - 1] || "🎯";
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
      {/* CSS Animations */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px #FFD700; }
            100% { transform: scale(1); }
          }
          
          @keyframes shine {
            0% { transform: rotate(45deg) translateX(-100%); }
            100% { transform: rotate(45deg) translateX(100%); }
          }
          
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}
      </style>

      {/* Animated background particles */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 12s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute",
        top: "50%",
        right: "10%",
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 6s ease-in-out infinite",
      }} />
      
      {/* Confetti effect */}
      {showConfetti && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1000,
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: "10px",
                height: "10px",
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                animation: "confetti 3s ease-out forwards",
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderRadius: "40px",
          padding: "30px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header with back button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={handleGoBack}
            style={{
              background: "white",
              border: "none",
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 5px 15px rgba(0,0,0,0.1)";
            }}
          >
            ←
          </button>
          
          <h1
            style={{
              fontSize: "36px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              fontWeight: "bold",
            }}
          >
            🎴 Clip Card Game
          </h1>
          
          <div style={{ width: "45px" }} />
        </div>

        {/* Game Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
            padding: "15px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
          }}>
            <span style={{
              fontSize: "14px",
              color: "#666",
              display: "block",
              marginBottom: "5px",
            }}>Level</span>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
            }}>
              {level} <span style={{ fontSize: "20px" }}>🔥</span>
            </span>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
            padding: "15px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
          }}>
            <span style={{
              fontSize: "14px",
              color: "#666",
              display: "block",
              marginBottom: "5px",
            }}>Score</span>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
            }}>{score}</span>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
            padding: "15px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
          }}>
            <span style={{
              fontSize: "14px",
              color: "#666",
              display: "block",
              marginBottom: "5px",
            }}>Moves</span>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#333",
            }}>{moves}</span>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
            padding: "15px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
          }}>
            <span style={{
              fontSize: "14px",
              color: "#666",
              display: "block",
              marginBottom: "5px",
            }}>Time</span>
            <span style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: timeLeft < 10 ? "#f44336" : "#333",
            }}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: "#e9ecef",
          borderRadius: "30px",
          height: "30px",
          marginBottom: "30px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
        }}>
          <div
            style={{
              background: "linear-gradient(90deg, #4CAF50, #8BC34A)",
              height: "100%",
              borderRadius: "30px",
              transition: "width 0.5s ease",
              width: `${progress}%`,
            }}
          />
          <span style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            {cards.filter(c => c.matched).length}/{cards.length} Cards Matched
          </span>
        </div>

        {/* Game Title */}
        <h2
          style={{
            fontSize: "24px",
            color: "#ff4500",
            marginBottom: "20px",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Level {level} {getLevelEmoji(level)}
        </h2>

        {gameOver ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            borderRadius: "30px",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "80px",
              marginBottom: "20px",
              animation: "float 3s ease-in-out infinite",
            }}>🏆</div>
            <p style={{
              fontSize: "24px",
              color: "#333",
              marginBottom: "20px",
              fontWeight: "600",
              lineHeight: "1.4",
            }}>{motivationQuote}</p>
            <p style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#4CAF50",
              marginBottom: "10px",
            }}>Final Score: {score}</p>
            <p style={{
              fontSize: "18px",
              color: "#666",
              marginBottom: "30px",
            }}>Moves: {moves}</p>
            
            <button
              onClick={nextLevel}
              style={{
                padding: "15px 40px",
                background: "linear-gradient(135deg, #ff4500 0%, #ff6b6b 100%)",
                border: "none",
                borderRadius: "50px",
                fontSize: "20px",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 5px 15px rgba(255, 69, 0, 0.3)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 10px 30px rgba(255, 69, 0, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 5px 15px rgba(255, 69, 0, 0.3)";
              }}
            >
              {level < 5 ? "Next Level 🚀" : "Play Again 🔄"}
            </button>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "10px",
                justifyContent: "center",
                marginBottom: "30px",
              }}
            >
              {cards.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  onClick={handleCardClick}
                  isDisabled={isChecking}
                />
              ))}
            </div>

            {/* Game Tips */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "15px",
              background: "rgba(102, 126, 234, 0.1)",
              borderRadius: "15px",
              border: "1px dashed #667eea",
            }}>
              <span style={{ fontSize: "24px" }}>💡</span>
              <span style={{
                fontSize: "16px",
                color: "#667eea",
                fontWeight: "500",
              }}>
                Match pairs of cute animals to score points!
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Styles object for particle animations
const styles = {
  particle1: {
    position: "absolute",
    top: "-10px",
    right: "0",
    fontSize: "16px",
    animation: "float 1s ease-in-out infinite",
  },
  particle2: {
    position: "absolute",
    bottom: "-10px",
    left: "0",
    fontSize: "16px",
    animation: "float 1.5s ease-in-out infinite reverse",
  },
  particle3: {
    position: "absolute",
    top: "50%",
    right: "-10px",
    fontSize: "16px",
    animation: "float 1.2s ease-in-out infinite",
  },
};

export default ClipCardGame;