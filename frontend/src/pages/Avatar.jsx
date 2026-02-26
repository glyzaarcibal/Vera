import { useState, useRef, useEffect } from 'react';
import { User, PawPrint, MessageSquare, PhoneOff } from 'lucide-react';
import DIDAgent from './DIDAgent';
import AnimalAI from './Animal';
import './AvatarAI.css';

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
    <div className="avatarai-container">
      <div className="avatarai-header">
        <h1 className="avatarai-title">Avatar <span style={{color:'#a78bfa'}}>Selection</span></h1>
      </div>
      <div className="avatarai-main">
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
                <div className="avatarai-option-icon"><Icon size={32} /></div>
                <div className="avatarai-option-name">{option.name}</div>
                <div className="avatarai-option-desc">{option.description}</div>
                <div style={{marginTop:'8px',fontSize:'0.8rem',color:isSelected?'#6c63ff':'#9490a8',fontWeight:600}}>
                  {isSelected ? 'Active Selection' : 'Click to Select'}
                </div>
              </button>
            );
          })}
        </div>
        <div className="avatarai-content-panel">
          {selectedAvatar && SelectedComponent && (
            <>
              <div className="avatarai-transcripts">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <MessageSquare size={18} style={{color:'#6c63ff'}} />
                    <span style={{fontWeight:700,fontSize:'1.1rem',color:'#4a4568'}}>Conversation</span>
                  </div>
                  <button className="avatarai-clear-btn" onClick={endCall}><PhoneOff size={14} style={{marginRight:4}}/>End</button>
                </div>
                <div style={{maxHeight:'200px',overflowY:'auto'}}>
                  {transcripts.length === 0 ? (
                    <div style={{textAlign:'center',color:'#bdbdbd',padding:'32px 0'}}>
                      <MessageSquare size={24} style={{opacity:0.3,marginBottom:8}} />
                      <div style={{fontWeight:600,fontSize:'0.95rem'}}>Awaiting interaction</div>
                      <div style={{fontSize:'0.85rem',marginTop:4}}>Your chat history will appear here</div>
                    </div>
                  ) : (
                    transcripts.map((transcript) => (
                      <div key={transcript.id} className="avatarai-transcript-item">
                        <div className="avatarai-transcript-meta">
                          <span style={{fontWeight:600,color:transcript.author==='User'?'#6c63ff':'#4a4568'}}>{transcript.author}</span>
                          <span style={{marginLeft:8}}>{transcript.timestamp}</span>
                        </div>
                        <div style={{fontSize:'1rem',color:'#222'}}>{transcript.text}</div>
                      </div>
                    ))
                  )}
                  <div ref={conversationEndRef} />
                </div>
                {transcripts.length > 0 && (
                  <div style={{textAlign:'center',color:'#9490a8',fontSize:'0.9rem',marginTop:'8px'}}>
                    {transcripts.length} message{transcripts.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div style={{background:'#fff',borderRadius:'16px',boxShadow:'0 2px 12px rgba(108,99,255,0.07)',padding:'24px 12px',minHeight:'320px',display:'flex',flexDirection:'column',alignItems:'center'}}>
                <SelectedComponent onTranscript={handleTranscript} />
              </div>
            </>
          )}
          {!selectedAvatar && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#9490a8',fontWeight:500}}>
              Select an avatar on the left to get started
            </div>
          )}
        </div>
      </div>
    </div>
  );
}