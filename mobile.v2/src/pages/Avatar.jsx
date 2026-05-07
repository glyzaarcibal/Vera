import { useState, useRef, useEffect } from 'react';
import { User, PawPrint, MessageSquare, PhoneOff, Zap, ArrowRight, CheckCircle2, MoveLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';
import './AvatarAI.css';

// Import local images
import HumanGuideImg from '../assets/human_guide.png';
import AnimalCompanionImg from '../assets/animal_companion.png';

export default function AvatarAI() {
  const user = useSelector((state) => state.auth.user);
  const tokens = user?.tokens ?? 0;
  const SESSION_COST = 3;
  const hasEnoughTokens = tokens >= SESSION_COST;

  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [transcripts, setTranscripts] = useState([]);

  const handleTranscript = (text, meta) => {
    setTranscripts(prev => [...prev, {
      id: Date.now(),
      text,
      author: meta?.author || 'Unknown',
      source: meta?.source || 'unknown',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const avatarOptions = [
    {
      id: 'human',
      name: 'The Human Guide',
      badge: 'CLINICAL WISDOM',
      icon: User,
      image: HumanGuideImg,
      description: 'A nurturing and relatable digital presence modeled after professional therapeutic counselors.',
      features: [
        'Offers structured cognitive exercises and nuanced verbal dialogue for complex emotional processing.',
        'Ideal for those seeking direct professional guidance, active listening, and high-fidelity social connection.'
      ],
      buttonText: 'Select Human Guide',
      colorTheme: 'purple',
      component: DIDAgent
    },
    {
      id: 'animal',
      name: 'The Animal Companion',
      badge: 'SENSORY GROUNDING',
      icon: PawPrint,
      image: AnimalCompanionImg,
      description: 'A non-verbal, intuitive partner designed for emotional regulation and sensory comfort.',
      features: [
        'Focuses on rhythmic breathing cues, calming bio-feedback, and non-judgmental silent companionship.',
        'Best for high-stress moments where quiet grounding and nature-inspired presence are preferred over conversation.'
      ],
      buttonText: 'Select Animal Companion',
      colorTheme: 'green',
      component: AnimalAI
    }
  ];

  const SelectedComponent = avatarOptions.find(opt => opt.id === selectedAvatar)?.component;

  const endCall = () => {
    setSelectedAvatar(null);
    setIsSessionStarted(false);
    setTranscripts([]);
  };

  const conversationEndRef = useRef(null);
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className={`avatarai-outer-container ${isSessionStarted ? 'session-active' : ''}`}>
      
      {!selectedAvatar && (
        <div className="avatarai-selection-header">
          <div className="avatarai-header-top">
            <div className="avatarai-logo">
              <div className="avatarai-logo-icon" />
              <span>V.E.R.A..</span>
            </div>
            <Link to="/hub" className="avatarai-back-link">
              <MoveLeft size={18} />
              <span>BACK TO HUB</span>
            </Link>
          </div>
            <div className="avatarai-header-content">
            <h1 className="avatarai-main-title">
              Choose Your <span className="avatarai-accent">Guide</span>
            </h1>
            <p className="avatarai-main-subtitle">
              Personalize your healing environment. Select the therapeutic presence that 
              resonates most with your emotional state today.
            </p>
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="avatarai-main-view">
        
        {!selectedAvatar ? (
          <>
            {!hasEnoughTokens ? (
              <div className="avatarai-token-gate">
                <div className="avatarai-gate-icon">
                  <Zap size={40} />
                </div>
                <h2 className="avatarai-gate-title">Tokens Required</h2>
                <p className="avatarai-gate-text">
                  Avatar AI sessions require <strong>{SESSION_COST} tokens</strong>. 
                  You currently have <strong>{tokens} tokens</strong>.
                </p>
                <button className="avatarai-earn-btn" onClick={() => window.location.href = "/activities"}>
                  Go to Activities to Earn Tokens
                </button>
              </div>
            ) : (
              <div className="avatarai-guide-grid">
                {avatarOptions.map((option) => (
                  <div key={option.id} className={`avatarai-guide-card ${option.colorTheme}`}>
                    <div className="avatarai-card-image-wrap">
                      <img src={option.image} alt={option.name} className="avatarai-card-image" />
                      <div className="avatarai-card-badge">{option.badge}</div>
                    </div>
                    <div className="avatarai-card-body">
                      <h2 className="avatarai-card-title">{option.name}</h2>
                      <p className="avatarai-card-description">{option.description}</p>
                      
                      <div className="avatarai-feature-list">
                        {option.features.map((feature, idx) => (
                          <div key={idx} className="avatarai-feature-item">
                            <div className="avatarai-feature-icon-wrap">
                              {option.id === 'human' ? (
                                <MessageSquare size={16} className="avatarai-feature-icon" />
                              ) : (
                                <Zap size={16} className="avatarai-feature-icon" />
                              )}
                            </div>
                            <p className="avatarai-feature-text">{feature}</p>
                          </div>
                        ))}
                      </div>

                      <button 
                        className={`avatarai-select-btn ${option.colorTheme}`}
                        onClick={() => setSelectedAvatar(option.id)}
                      >
                        <span>{option.buttonText}</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="avatarai-footer-note">
              You can switch your guide at any time during your journey. Both options 
              provide the same level of V.E.R.A. core therapeutic monitoring.
            </div>
          </>
        ) : (
          <div className={`avatarai-session-container ${!isSessionStarted ? 'selection-mode' : ''}`}>
            {/* Left — Agent shell */}
            <div className="avatarai-agent-column">
              <div className="avatarai-agent-shell">
                <SelectedComponent 
                  onTranscript={handleTranscript} 
                  onEnd={endCall} 
                  setSessionStarted={setIsSessionStarted}
                />
              </div>
            </div>

            {/* Right — Conversation panel (Only shown if session started) */}
            {isSessionStarted && (
              <div className="avatarai-transcripts-column">
                <div className="avatarai-transcripts">
                  <div className="avatarai-conversation-header">
                    <div className="avatarai-conversation-title-wrap">
                      <MessageSquare size={17} className="avatarai-conversation-icon" />
                      <span className="avatarai-conversation-title">Conversation History</span>
                    </div>
                    <button className="avatarai-end-call-btn" onClick={endCall}>
                      <PhoneOff size={14} />
                      <span>End Session</span>
                    </button>
                  </div>

                  <div className="avatarai-transcript-list">
                    {transcripts.length === 0 ? (
                      <div className="avatarai-transcript-empty">
                        <div className="avatarai-pulse-ring">
                          <MessageSquare size={32} />
                        </div>
                        <div className="avatarai-transcript-empty-title">Awaiting interaction</div>
                        <div className="avatarai-transcript-empty-subtitle">
                          Your dialogue with {avatarOptions.find(o => o.id === selectedAvatar)?.name} will appear here.
                        </div>
                      </div>
                    ) : (
                      transcripts.map((transcript) => (
                        <div key={transcript.id} className={`avatarai-transcript-item ${transcript.author === 'User' ? 'user' : 'ai'}`}>
                          <div className="avatarai-transcript-meta">
                            <span className="author-name">{transcript.author}</span>
                            <span className="timestamp">{transcript.timestamp}</span>
                          </div>
                          <div className="avatarai-transcript-text">{transcript.text}</div>
                        </div>
                      ))
                    )}
                    <div ref={conversationEndRef} />
                  </div>

                  {transcripts.length > 0 && (
                    <div className="avatarai-session-stats">
                      Total messages: {transcripts.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}