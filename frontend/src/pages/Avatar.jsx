import { useState, useRef, useEffect } from 'react';
import { User, PawPrint, MessageSquare, PhoneOff } from 'lucide-react';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';
import './AvatarAI.css';

export default function AvatarAI() {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
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
      name: 'Human Agent',
      icon: User,
      description: 'Realistic human avatar with voice emotion detection via Hume AI Prosody model',
      component: DIDAgent
    },
    {
      id: 'animal',
      name: 'Animal Avatar',
      icon: PawPrint,
      description: 'Cute animal character AI assistant',
      component: AnimalAI
    }
  ];

  const SelectedComponent = avatarOptions.find(opt => opt.id === selectedAvatar)?.component;

  const endCall = () => {
    setSelectedAvatar(null);
    setTranscripts([]);
  };

  const conversationEndRef = useRef(null);
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="avatarai-outer-container">

      {/* ── Page Header ── */}
      <div className="avatarai-page-header">
        <div className="avatarai-eyebrow">🤖 Avatar AI</div>
        <h1 className="avatarai-title">
          Avatar <span className="avatarai-title-accent">Selection</span>
        </h1>
        <p className="avatarai-subtitle">
          Choose your AI companion and start a conversation
        </p>
      </div>

      {/* ── Avatar Type Picker ── */}
      <div className="avatarai-options">
        {avatarOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedAvatar === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedAvatar(option.id)}
              className={`avatarai-option${isSelected ? ' selected' : ''}`}
            >
              <div className="avatarai-option-icon">
                <Icon size={22} />
              </div>
              <div className="avatarai-option-name">{option.name}</div>
              <div className="avatarai-option-desc">{option.description}</div>
              <div className={`avatarai-option-status${isSelected ? ' is-selected' : ''}`}>
                {isSelected ? '● Active Selection' : 'Click to Select'}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Content Area ── */}
      <div className="avatarai-content-panel">

        {/* Left — Agent shell */}
        {selectedAvatar && SelectedComponent ? (
          <div className="avatarai-agent-shell">
            <SelectedComponent onTranscript={handleTranscript} onEnd={endCall} />
          </div>
        ) : (
          <div className="avatarai-placeholder">
            <div className="avatarai-placeholder-icon">🤖</div>
            <span>Select an avatar above to get started</span>
          </div>
        )}

        {/* Right — Conversation panel */}
        <div className="avatarai-transcripts">
          <div className="avatarai-conversation-header">
            <div className="avatarai-conversation-title-wrap">
              <MessageSquare size={17} className="avatarai-conversation-icon" />
              <span className="avatarai-conversation-title">Conversation</span>
            </div>
            {selectedAvatar && (
              <button className="avatarai-clear-btn" onClick={endCall}>
                <PhoneOff size={12} />
                <span>End</span>
              </button>
            )}
          </div>

          <div className="avatarai-transcript-list">
            {transcripts.length === 0 ? (
              <div className="avatarai-transcript-empty">
                <MessageSquare size={28} className="avatarai-transcript-empty-icon" />
                <div className="avatarai-transcript-empty-title">Awaiting interaction</div>
                <div className="avatarai-transcript-empty-subtitle">
                  Your chat history will appear here
                </div>
              </div>
            ) : (
              transcripts.map((transcript) => (
                <div key={transcript.id} className="avatarai-transcript-item">
                  <div className="avatarai-transcript-meta">
                    <span style={{
                      fontWeight: 700,
                      color: transcript.author === 'User' ? '#7c3aed' : '#4a4568'
                    }}>
                      {transcript.author}
                    </span>
                    <span>·</span>
                    <span>{transcript.timestamp}</span>
                  </div>
                  <div className="avatarai-transcript-text">{transcript.text}</div>
                </div>
              ))
            )}
            <div ref={conversationEndRef} />
          </div>

          {transcripts.length > 0 && (
            <div className="avatarai-message-count">
              {transcripts.length} message{transcripts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}