import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, ShieldCheck, Heart, Sparkles, User, Shirt, Check } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateTokens } from '../store/slices/authSlice';
import './AvatarAI.css';

// Assets
import womanAmericaVideo from '../assets/Unleash+yo.mp4';
import americanGirlVideo from '../assets/american-girl.mp4';
import americanGirl1Video from '../assets/american-girl-1.mp4';
import americanGirl1ThinkingVideo from '../assets/american-girl-1-thinking.mp4';
import americanGirl2Video from '../assets/american-girl-2.mp4';
import americanGirl3Video from '../assets/american-girl-3.mp4';
import manAmericaVideo from '../assets/_Removed+D.mp4';
import womanFilipinoVideo from '../assets/pinoywomen.mp4';
import manFilipinoVideo from '../assets/filipino-boy.mp4';
import americanBoyVideo from '../assets/american-boy.mp4';
import americanBoy1Video from '../assets/american-boy-1.mp4';
import americanBoy2Video from '../assets/american-boy-2.mp4';
import americanBoy3Video from '../assets/american-boy-3.mp4';
import filipinoBoyVideo from '../assets/filipino-boy.mp4';
import filipinoBoy1Video from '../assets/filipino-boy-1.mp4';
import filipinoBoy2Video from '../assets/filipino-boy-2.mp4';
import filipinoBoy3Video from '../assets/filipino-boy-3.mp4';
import filipinoGirlVideo from '../assets/filipino-girl.mp4';
import filipinoGirl1Video from '../assets/filipino-girl-1.mp4';
import filipinoGirl2Video from '../assets/filipino-girl-2.mp4';
import filipinoGirl3Video from '../assets/filipino-girl-3.mp4';

// Preview Images
import AmericanGirlImg from '../assets/american-girl.png';
import AmericanGirl1Img from '../assets/american-girl-1.png';
import AmericanGirl2Img from '../assets/american-girl-2.png';
import AmericanGirl3Img from '../assets/american-girl-3.png';

import AmericanBoyImg from '../assets/american-boy.png';
import AmericanBoy1Img from '../assets/american-boy-1.png';
import AmericanBoy2Img from '../assets/american-boy-2.png';
import AmericanBoy3Img from '../assets/american-boy-3.png';

import FilipinoGirlImg from '../assets/filipino-girl.png';
import FilipinoGirl1Img from '../assets/filipino-girl-1.png';
import FilipinoGirl2Img from '../assets/filipino-girl-2.png';
import FilipinoGirl3Img from '../assets/filipino-girl-3.png';

import FilipinoBoyImg from '../assets/filipino-boy.png';
import FilipinoBoy1Img from '../assets/filipino-boy-1.png';
import FilipinoBoy2Img from '../assets/filipino-boy-2.png';
import FilipinoBoy3Img from '../assets/filipino-boy-3.png';

import axiosInstance from '../utils/axios.instance';

export default function DIDAgent({ onTranscript, onEnd, setSessionStarted }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState('default');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const AVATAR_OPTIONS = [
    {
      id: 'american-girl',
      name: 'Elena',
      region: 'North America',
      tag: 'EMOTIONAL RESILIENCE',
      description: 'Elena focuses on cognitive behavioral support and long-term resilience building.',
      images: { default: AmericanGirlImg, '1': AmericanGirl1Img, '2': AmericanGirl2Img, '3': AmericanGirl3Img },
      videoType: 'american-girl',
      voiceId: 'cgSgspJ2msm6clMCkdW9',
      videos: { default: americanGirlVideo, '1': americanGirl1Video, '2': americanGirl2Video, '3': americanGirl3Video }
    },
    {
      id: 'american-boy',
      name: 'Julian',
      region: 'North America',
      tag: 'MINDFULNESS EXPERT',
      description: 'Julian specializes in breathwork and grounding techniques for high-stress moments.',
      images: { default: AmericanBoyImg, '1': AmericanBoy1Img, '2': AmericanBoy2Img, '3': AmericanBoy3Img },
      videoType: 'american-boy',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      videos: { default: americanBoyVideo, '1': americanBoy1Video, '2': americanBoy2Video, '3': americanBoy3Video }
    },
    {
      id: 'filipino-girl',
      name: 'Sofia',
      region: 'Southeast Asia',
      tag: 'TRAUMA SUPPORT',
      description: 'Sofia provides trauma-sensitive guidance with a soft, non-judgmental approach.',
      images: { default: FilipinoGirlImg, '1': FilipinoGirl1Img, '2': FilipinoGirl2Img, '3': FilipinoGirl3Img },
      videoType: 'filipino-girl',
      voiceId: 'cgSgspJ2msm6clMCkdW9',
      videos: { default: filipinoGirlVideo, '1': filipinoGirl1Video, '2': filipinoGirl2Video, '3': filipinoGirl3Video }
    },
    {
      id: 'filipino-boy',
      name: 'Lito',
      region: 'Southeast Asia',
      tag: 'LIFE TRANSITIONS',
      description: 'Lito offers wisdom-led support for those facing major life changes and professional burnout.',
      images: { default: FilipinoBoyImg, '1': FilipinoBoy1Img, '2': FilipinoBoy2Img, '3': FilipinoBoy3Img },
      videoType: 'filipino-boy',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      videos: { default: filipinoBoyVideo, '1': filipinoBoy1Video, '2': filipinoBoy2Video, '3': filipinoBoy3Video }
    }
  ];

  const getCurrentVideo = () => {
    const agent = AVATAR_OPTIONS.find(a => a.id === selectedAgent);
    if (!agent) return americanGirlVideo;
    
    // Special thinking video for Elena Outfit 1
    if (selectedAgent === 'american-girl' && selectedOutfit === '1' && isProcessing) {
      return americanGirl1ThinkingVideo;
    }
    
    return agent.videos[selectedOutfit] || agent.videos.default;
  };

  const initializeSession = async () => {
    if (!selectedAgent) return;
    try {
      const agent = AVATAR_OPTIONS.find(a => a.id === selectedAgent);
      const res = await axiosInstance.post(`/sessions/start-session/Avatar`, {
        avatar: { type: agent.id, label: agent.name, language: 'eng', outfit: selectedOutfit }
      });
      const { session, updatedTokens } = res.data;
      if (updatedTokens !== null) dispatch(updateTokens(updatedTokens));
      setSessionId(session.id);
      setIsSessionActive(true);
      setSessionStarted(true);
    } catch (e) {
      console.error('Session error:', e);
      setError('Failed to start session');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 1000) await transcribeAudio(audioBlob);
      };
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsListening(false);
  };

  const transcribeAudio = async (blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model_id', 'scribe_v2');
      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        body: formData
      });
      const data = await res.json();
      if (data.text) {
        onTranscript?.(data.text, { author: 'User', source: 'did' });
        await getAIResponse(data.text);
      }
    } catch (e) {
      setError('Transcription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (text) => {
    setIsProcessing(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are a compassionate therapeutic companion.' }, { role: 'user', content: text }],
          max_tokens: 150
        })
      });
      const data = await res.json();
      const aiMsg = data.choices[0]?.message?.content;
      if (aiMsg) {
        onTranscript?.(aiMsg, { author: AVATAR_OPTIONS.find(a => a.id === selectedAgent)?.name || 'AI', source: 'did' });
        await speakText(aiMsg);
      }
    } catch (e) {
      setError('AI error');
    } finally {
      if (!isSpeaking) setIsProcessing(false);
    }
  };

  const speakText = async (text) => {
    setIsProcessing(false);
    try {
      const agent = AVATAR_OPTIONS.find(a => a.id === selectedAgent);
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${agent.voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
      });
      const blob = await res.blob();
      audioRef.current.src = URL.createObjectURL(blob);
      setIsSpeaking(true);
      audioRef.current.play();
      videoRef.current?.play();
    } catch (e) {
      setError('Speech error');
    }
  };

  const handleAudioEnd = () => {
    setIsSpeaking(false);
    videoRef.current?.pause();
  };

  const toggleListening = () => isListening ? stopRecording() : startRecording();

  return (
    <div className="didagent-wrapper">
      {!isSessionActive ? (
        <div className="didagent-selection-container">
          <div className="didagent-selection-header">
            <h1 className="didagent-selection-title">
              Select Your <span className="didagent-accent">Guide</span>
            </h1>
            <p className="didagent-selection-subtitle">
              Choose an avatar and outfit that makes you feel most comfortable.
            </p>
          </div>

          <div className="didagent-guide-grid">
            {AVATAR_OPTIONS.map((agent) => (
              <div 
                key={agent.id} 
                className={`didagent-guide-card ${selectedAgent === agent.id ? 'most-trusted' : ''}`}
                onClick={() => setSelectedAgent(agent.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="didagent-guide-avatar-wrap">
                  <img 
                    src={selectedAgent === agent.id ? (agent.images[selectedOutfit] || agent.images.default) : agent.images.default} 
                    alt={agent.name} 
                    className="didagent-guide-avatar" 
                  />
                  {selectedAgent === agent.id && (
                    <div className="didagent-selection-check">
                      <Check size={20} color="white" />
                    </div>
                  )}
                </div>
                <h3 className="didagent-guide-name">{agent.name}</h3>
                <div className="didagent-guide-tag">{agent.tag}</div>
                
                {selectedAgent === agent.id && (
                  <div className="didagent-outfit-selector" onClick={(e) => e.stopPropagation()}>
                    <div className="didagent-outfit-label">
                      <Shirt size={14} />
                      <span>Choose Outfit</span>
                    </div>
                    <div className="didagent-outfit-buttons">
                      {['default', '1', '2', '3'].map((o) => (
                        <button 
                          key={o} 
                          className={`didagent-outfit-btn ${selectedOutfit === o ? 'active' : ''}`}
                          onClick={() => setSelectedOutfit(o)}
                        >
                          {o === 'default' ? 'D' : o}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  className="didagent-connect-btn" 
                  onClick={(e) => { e.stopPropagation(); if(selectedAgent === agent.id) initializeSession(); else setSelectedAgent(agent.id); }}
                  disabled={selectedAgent !== agent.id}
                  style={{ marginTop: 'auto', opacity: selectedAgent === agent.id ? 1 : 0.5 }}
                >
                  {selectedAgent === agent.id ? 'Start Session' : 'Select'}
                </button>
              </div>
            ))}
          </div>

          <div className="didagent-footer-info">
            <div className="didagent-footer-item">
              <ShieldCheck size={24} className="didagent-footer-icon" />
              <div>
                <h4>Secure & Private</h4>
                <p>Military-grade encryption for all sessions.</p>
              </div>
            </div>
            <div className="didagent-footer-item">
              <Sparkles size={24} className="didagent-footer-icon" />
              <div>
                <h4>Clinical Precision</h4>
                <p>Built on evidence-based therapeutic models.</p>
              </div>
            </div>
            <div className="didagent-footer-item">
              <Heart size={24} className="didagent-footer-icon" />
              <div>
                <h4>Human-First</h4>
                <p>Prioritizing empathy over algorithms.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="didagent-session-container">
          <div className="didagent-video-wrap">
            <video
              ref={videoRef}
              src={getCurrentVideo()}
              className="didagent-video"
              playsInline
              loop={!isSpeaking && !isProcessing}
              muted={true}
            />
            
            <div className="didagent-hud">
              <div className="didagent-hud-info">
                <img 
                  src={AVATAR_OPTIONS.find(a => a.id === selectedAgent)?.images[selectedOutfit] || AVATAR_OPTIONS.find(a => a.id === selectedAgent)?.images.default} 
                  alt="Agent" 
                  className="didagent-hud-avatar" 
                />
                <div>
                  <div className="didagent-hud-name">{AVATAR_OPTIONS.find(a => a.id === selectedAgent)?.name}</div>
                  <div className="didagent-hud-status">
                    <span className={`didagent-status-dot ${isSpeaking ? 'speaking' : isProcessing ? 'thinking' : 'online'}`} />
                    {isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Online'}
                  </div>
                </div>
              </div>
              <button className="didagent-change-btn" onClick={() => { setIsSessionActive(false); setSessionId(null); setSessionStarted(false); }}>
                Change Agent
              </button>
            </div>

            {error && <div className="didagent-error-toast">{error}</div>}
          </div>

          <div className="didagent-controls">
            <button
              onClick={toggleListening}
              disabled={isProcessing || isSpeaking}
              className={`didagent-mic-btn ${isListening ? 'active' : ''}`}
            >
              {isListening ? <Mic size={32} /> : <MicOff size={32} />}
            </button>
            <button onClick={() => { onEnd?.(); setIsSessionActive(false); }} className="didagent-end-btn">
              <PhoneOff size={32} />
            </button>
          </div>
          <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        </div>
      )}
    </div>
  );
}