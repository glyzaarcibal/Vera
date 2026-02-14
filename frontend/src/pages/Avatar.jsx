import { useState } from 'react';
import { User, Box, PawPrint, MessageSquare } from 'lucide-react';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';

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
      description: 'Realistic human avatar powered by D-ID',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-1">Avatar AI Selector</h1>
          <p className="text-sm text-gray-400">Choose your preferred avatar type</p>
        </div>

        {/* Avatar Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {avatarOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedAvatar === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => setSelectedAvatar(option.id)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <Icon 
                  size={48} 
                  className={`mx-auto mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} 
                />
                <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {option.name}
                </h3>
                <p className={`text-xs ${isSelected ? 'text-gray-100' : 'text-gray-500'}`}>
                  {option.description}
                </p>
                {isSelected && (
                  <div className="mt-2 text-xs text-white bg-white/20 rounded px-3 py-1 inline-block">
                    Active
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Avatar Component */}
        {selectedAvatar && SelectedComponent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Avatar Display */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="h-[500px]">
                <SelectedComponent onTranscript={handleTranscript} />
              </div>
            </div>

            {/* Conversation Transcript Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
              <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-400" />
                  <h3 className="text-base font-bold text-white">Conversation</h3>
                </div>
                {transcripts.length > 0 && (
                  <button
                    onClick={clearTranscripts}
                    className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[440px]">
                {transcripts.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    <MessageSquare size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Start chatting with your avatar</p>
                  </div>
                ) : (
                  transcripts.map((transcript) => (
                    <div
                      key={transcript.id}
                      className={`p-2 rounded-lg ${
                        transcript.author === 'User'
                          ? 'bg-blue-900/30 ml-4'
                          : 'bg-gray-700/50 mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${
                          transcript.author === 'User' ? 'text-blue-300' : 'text-green-300'
                        }`}>
                          {transcript.author}
                        </span>
                        <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-200 break-words">{transcript.text}</p>
                    </div>
                  ))
                )}
              </div>

              {transcripts.length > 0 && (
                <div className="p-2 border-t border-gray-700 text-xs text-gray-400 text-center">
                  {transcripts.length} message{transcripts.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedAvatar && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-base">
              ðŸ‘† Select an avatar to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}