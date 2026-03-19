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
              transcripts.map((transcript) => {
                const detectActivity = (text) => {
                  if (!text) return [];
                  const textLower = text.toLowerCase();

                  const activities = [
                    { 
                      name: 'Take a Breath', 
                      path: '/activities/take-a-breath', 
                      icon: '🌬️', 
                      desc: 'Guided breathing exercise for quick relaxation',
                      keywords: ['take a breath', 'breathing exercise', 'breathe deeply', 'inhale slowly', 'deep breath', 'exhale'] 
                    },
                    { 
                      name: 'Diary', 
                      path: '/activities/diary', 
                      icon: '📓', 
                      desc: 'Write and track your daily thoughts',
                      keywords: ['diary', 'journal', 'write your thoughts', 'writing down', 'write down your feelings']
                    },
                    { 
                      name: 'Mood Tracker', 
                      path: '/activities/mood-tracker', 
                      icon: '😊', 
                      desc: 'Track and monitor your mood',
                      keywords: ['mood tracker', 'track your mood', 'monitor your mood', 'log your mood']
                    },
                    { 
                      name: 'Sleep Tracker', 
                      path: '/activities/sleep-tracker', 
                      icon: '😴', 
                      desc: 'Monitor your sleep patterns',
                      keywords: ['sleep tracker', 'track your sleep', 'monitor your sleep', 'sleep log']
                    },
                    { 
                      name: 'Clipcard Game', 
                      path: '/activities/clipcard', 
                      icon: '🎮', 
                      desc: 'Test your memory with matching cards',
                      keywords: ['clipcard game', 'memory game', 'matching cards', 'play a game', 'distract yourself']
                    },
                    { 
                      name: 'Weekly Wellness Report', 
                      path: '/activities/weekly-wellness-report', 
                      icon: '📊', 
                      desc: 'View your weekly insights',
                      keywords: ['weekly wellness report', 'wellness report', 'weekly progress']
                    },
                    { 
                      name: 'Medication History', 
                      path: '/activities/medication-history', 
                      icon: '💊', 
                      desc: 'Log and track medication',
                      keywords: ['medication history', 'track medication', 'log medication', 'medication reminder']
                    },
                  ];

                  return activities.filter(act => act.keywords.some(kw => textLower.includes(kw)));
                };

                const matchedActivities = transcript.author !== 'User' ? detectActivity(transcript.text) : [];

                return (
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
                    
                    {/* ── Suggested Activity Cards ── */}
                    {matchedActivities.length > 0 && (
                      <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-indigo-100/40">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Suggested Activity</p>
                        {matchedActivities.map((act, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => window.location.href = act.path}
                            className="flex items-center gap-3 p-3 bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-xl cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 transition-all duration-200 group"
                          >
                            <div className="text-2xl group-hover:scale-110 transition-transform">{act.icon}</div>
                            <div className="flex flex-col flex-1">
                              <span className="font-bold text-indigo-900 text-sm">{act.name}</span>
                              <span className="text-slate-500 text-xs">{act.desc}</span>
                            </div>
                            <div className="text-indigo-400 group-hover:text-indigo-600 transition-colors group-hover:translate-x-1 duration-200">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
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