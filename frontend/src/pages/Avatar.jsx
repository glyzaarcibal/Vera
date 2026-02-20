import { useState, useRef, useEffect } from 'react';
import { User, PawPrint, MessageSquare, PhoneOff } from 'lucide-react';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';
import './Welcome.css';

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
    <div className="welcome-container max-w-4xl">
      <div className="text-center mb-6">
        <div className="hero-badge text-xs py-1.5 px-3 inline-block">Avatar AI</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mt-3 mb-1">
          Choose Your <span className="gradient-text">Avatar</span>
        </h1>
        <p className="text-sm text-gray-600">Select an avatar type to start your AI-powered conversation</p>
      </div>

      {/* Avatar Selection Grid - compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
        {avatarOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedAvatar === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedAvatar(option.id)}
              className={`bg-white rounded-xl border-2 p-4 sm:p-5 text-left cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                isSelected
                  ? 'border-[#667eea] shadow-md shadow-[rgba(102,126,234,0.2)] ring-2 ring-[#667eea]/30'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#667eea] text-white' : 'bg-gray-100 text-[#667eea]'}`}>
                <Icon size={20} className="shrink-0" />
              </div>
              <h3 className="text-base font-semibold text-[#1a1a1a] mt-3">{option.name}</h3>
              <p className="text-sm text-gray-600 mt-0.5">{option.description}</p>
              {isSelected && (
                <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold text-[#667eea] bg-[#f5f5ff] rounded-full">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Avatar Component - conversation panel first on mobile so AI chat is visible on screen */}
      {selectedAvatar && SelectedComponent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation panel - first on mobile (order-1), right on desktop (lg:order-2) */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col overflow-hidden order-1 lg:order-2 min-h-[280px]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="feature-icon w-9 h-9 flex items-center justify-center">
                  <MessageSquare size={18} className="text-[#667eea]" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a]">Conversation</h3>
              </div>
              <div className="flex items-center gap-2">
                {transcripts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearTranscripts}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={endCall}
                  className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium inline-flex items-center gap-1.5"
                >
                  <PhoneOff size={14} />
                  End call
                </button>
              </div>
            </div>
              
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[440px]">
              {transcripts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare size={40} className="mx-auto mb-2 opacity-30 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No messages yet</p>
                  <p className="text-xs mt-1">Start chatting with your avatar</p>
                </div>
              ) : (
                transcripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className={`p-3 rounded-xl text-left ${
                      transcript.author === 'User'
                        ? 'bg-[#f5f5ff] ml-2 border border-[#e8e8ff]'
                        : 'bg-gray-50 mr-2 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${
                        transcript.author === 'User' ? 'text-[#667eea]' : 'text-gray-700'
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