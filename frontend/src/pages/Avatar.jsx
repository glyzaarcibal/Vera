import { useState, useRef, useEffect } from 'react';
import { User, PawPrint, MessageSquare, PhoneOff } from 'lucide-react';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';
import './Welcome.css';
import "../styles/GlobalDesign.css";

export default function AvatarAI() {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [transcripts, setTranscripts] = useState([]);

  const handleTranscript = (text, meta) => {
    const newTranscript = {
      id: Date.now(),
      text,
      author: meta?.author || 'Unknown',
      source: meta?.source || 'unknown',
      timestamp: new Date().toLocaleTimeString()
    };
    setTranscripts(prev => [...prev, newTranscript]);
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

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  const endCall = () => {
    setSelectedAvatar(null);
    setTranscripts([]);
  };

  const conversationEndRef = useRef(null);
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Avatar <span className="gradient-text">Selection</span>
        </h1>
        <p className="page-subtitle">Choose your AI companion for a personalized interaction</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {avatarOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedAvatar === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedAvatar(option.id)}
              className={`design-section text-left p-6 sm:p-8 cursor-pointer transition-all duration-500 border-2 relative overflow-hidden group ${isSelected
                  ? 'border-indigo-400 ring-4 ring-indigo-50 shadow-xl'
                  : 'border-transparent hover:border-indigo-100'
                }`}
            >
              <div className={`section-icon mb-6 group-hover:scale-110 transition-transform ${isSelected ? 'shadow-lg shadow-indigo-100' : ''}`}>
                <Icon size={24} className={isSelected ? 'text-[#667eea]' : 'text-[#a78bfa]'} />
              </div>
              <h3 className="section-title mb-2">{option.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{option.description}</p>
              <div className={`mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                {isSelected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Active Selection
                  </>
                ) : (
                  'Click to Select'
                )}
              </div>
              {isSelected && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                    <Icon size={12} />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Avatar Component - conversation panel first on mobile so AI chat is visible on screen */}
      {selectedAvatar && SelectedComponent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="design-section flex flex-col p-0 overflow-hidden order-1 lg:order-2 min-h-[400px]">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <MessageSquare size={18} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Conversation</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={endCall}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <PhoneOff size={14} />
                  End
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
              {transcripts.length === 0 ? (
                <div className="text-center text-gray-300 py-20 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={24} className="opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Awaiting interaction</p>
                  <p className="text-xs mt-2 text-gray-400">Your chat history will appear here</p>
                </div>
              ) : (
                transcripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className={`p-3 rounded-xl text-left ${transcript.author === 'User'
                      ? 'bg-[#f5f5ff] ml-2 border border-[#e8e8ff]'
                      : 'bg-gray-50 mr-2 border border-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${transcript.author === 'User' ? 'text-[#667eea]' : 'text-gray-700'
                        }`}>
                        {transcript.author}
                      </span>
                      <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700 break-words">{transcript.text}</p>
                  </div>
                ))
              )}
              <div ref={conversationEndRef} />
            </div>
            {transcripts.length > 0 && (
              <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center bg-gray-50/50">
                {transcripts.length} message{transcripts.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Avatar / video - second on mobile (order-2), left on desktop (lg:order-1) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 order-2 lg:order-1 flex flex-col min-h-[360px] max-h-[44vh]">
            <div className="flex-1 flex flex-col min-h-[320px]">
              <SelectedComponent onTranscript={handleTranscript} />
            </div>
          </div>
        </div>
      )}

      {!selectedAvatar && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Select an avatar above to get started
          </p>
        </div>
      )}
    </div>
  );
}