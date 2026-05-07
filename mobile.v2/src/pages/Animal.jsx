import React, { useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, PawPrint, Heart, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateTokens } from '../store/slices/authSlice';
import './AvatarAI.css';
import meowVideo from '../assets/meow+meow+.mp4';
import arfarfVideo from '../assets/++arf+arf+.mp4';
import CatImg from '../assets/cat_companion.png';
import DogImg from '../assets/dog_companion.png';
import axiosInstance from '../utils/axios.instance';

export default function AnimalAI({ onTranscript, onEnd, setSessionStarted }) {
  const [animalType, setAnimalType] = useState(null); 
  const [input, setInput] = useState('');
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

  const ANIMAL_GUIDES = [
    {
      id: 'cat',
      name: 'Luna',
      tag: 'PLAYFUL COMPANION',
      description: 'Luna is a gentle calico who offers soft purrs and empathetic listening, perfect for moments when you just need a quiet, steady presence.',
      image: CatImg,
      video: meowVideo,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      personality: 'You are Luna, a playful, slightly sassy but deeply empathetic cat AI companion. Respond with feline charm and occasional "meows."'
    },
    {
      id: 'dog',
      name: 'Cooper',
      tag: 'LOYAL PROTECTOR',
      description: 'Cooper is a devoted golden retriever who brings boundless warmth and encouragement, acting as a joyful anchor for your emotional well-being.',
      image: DogImg,
      video: arfarfVideo,
      voiceId: 'JBFqnCBsd6RMkjVDRZzb',
      personality: 'You are Cooper, an enthusiastic, loyal dog AI companion. Respond with boundless energy, warmth, and occasional "woofs!"'
    }
  ];

  const initializeSession = async (type) => {
    try {
      const guide = ANIMAL_GUIDES.find(g => g.id === type);
      const res = await axiosInstance.post(`/sessions/start-session/Avatar`, {
        avatar: { type: guide.id, label: guide.name, language: 'eng' }
      });
      const { session, updatedTokens } = res.data;
      if (updatedTokens !== null) dispatch(updateTokens(updatedTokens));
      setSessionId(session.id);
      setAnimalType(type);
      setSessionStarted(true);
    } catch (e) {
      console.error('Session error:', e);
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
        onTranscript?.(data.text, { author: 'User', source: 'animal' });
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
      const guide = ANIMAL_GUIDES.find(g => g.id === animalType);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: guide.personality }, { role: 'user', content: text }],
          max_tokens: 150
        })
      });
      const data = await res.json();
      const aiMsg = data.choices[0]?.message?.content;
      if (aiMsg) {
        onTranscript?.(aiMsg, { author: guide.name, source: 'animal' });
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
      const guide = ANIMAL_GUIDES.find(g => g.id === animalType);
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${guide.voiceId}`, {
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
    <div className="animal-wrapper">
      {!animalType ? (
        <div className="didagent-selection-container">
          <div className="didagent-selection-header">
            <h1 className="didagent-selection-title">
              Select Your <span className="didagent-accent">Animal Companion</span>
            </h1>
            <p className="didagent-selection-subtitle">
              Connect with our friendly AI animals designed to provide unconditional love, 
              sensory grounding, and a playful space for healing.
            </p>
          </div>

          <div className="didagent-guide-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', maxWidth: '900px', margin: '0 auto 80px' }}>
            {ANIMAL_GUIDES.map((guide) => (
              <div key={guide.id} className="didagent-guide-card">
                <div className="didagent-guide-avatar-wrap" style={{ borderRadius: '40px' }}>
                  <img src={guide.image} alt={guide.name} className="didagent-guide-avatar" />
                </div>
                <h3 className="didagent-guide-name">{guide.name}</h3>
                <div className="didagent-guide-tag" style={{ background: guide.id === 'cat' ? '#fdf2f8' : '#fff7ed', color: guide.id === 'cat' ? '#db2777' : '#ea580c' }}>{guide.tag}</div>
                <p className="didagent-guide-desc">{guide.description}</p>
                <button className="didagent-connect-btn" onClick={() => initializeSession(guide.id)}>
                  Connect Now
                </button>
              </div>
            ))}
          </div>

          <div className="didagent-footer-info">
            <div className="didagent-footer-item">
              <PawPrint size={24} className="didagent-footer-icon" style={{ color: '#ec4899', background: '#fdf2f8' }} />
              <div>
                <h4>Unconditional Love</h4>
                <p>Non-judgmental companionship 24/7.</p>
              </div>
            </div>
            <div className="didagent-footer-item">
              <Sparkles size={24} className="didagent-footer-icon" style={{ color: '#f59e0b', background: '#fffbeb' }} />
              <div>
                <h4>Sensory Grounding</h4>
                <p>Designed for immediate emotional regulation.</p>
              </div>
            </div>
            <div className="didagent-footer-item">
              <Heart size={24} className="didagent-footer-icon" style={{ color: '#ef4444', background: '#fef2f2' }} />
              <div>
                <h4>Playful Healing</h4>
                <p>Lighthearted interaction for deep relief.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="didagent-session-container">
          <div className="didagent-video-wrap">
            <video
              ref={videoRef}
              src={ANIMAL_GUIDES.find(g => g.id === animalType)?.video}
              className="didagent-video"
              style={{ objectFit: 'cover' }}
              playsInline
              loop
              muted={true}
            />
            
            <div className="didagent-hud">
              <div className="didagent-hud-info">
                <img src={ANIMAL_GUIDES.find(g => g.id === animalType)?.image} alt="Animal" className="didagent-hud-avatar" />
                <div>
                  <div className="didagent-hud-name">{ANIMAL_GUIDES.find(g => g.id === animalType)?.name} AI</div>
                  <div className="didagent-hud-status">
                    <span className={`didagent-status-dot ${isSpeaking ? 'speaking' : isProcessing ? 'thinking' : 'online'}`} />
                    {isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Online'}
                  </div>
                </div>
              </div>
              <button className="didagent-change-btn" onClick={() => { setAnimalType(null); setSessionId(null); setSessionStarted(false); }}>
                Change Companion
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
            <button onClick={() => { onEnd?.(); setAnimalType(null); }} className="didagent-end-btn">
              <PhoneOff size={32} />
            </button>
          </div>
          <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        </div>
      )}
    </div>
  );
}
