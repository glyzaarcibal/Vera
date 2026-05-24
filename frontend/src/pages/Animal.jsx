import React, { useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, PawPrint, Heart, Sparkles, MoveLeft } from 'lucide-react';
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
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const MIC_ACCESS_GUIDE_KEY = 'vera_mic_access_guide_seen';

  const ANIMAL_GUIDES = [
    {
      id: 'cat',
      name: 'Luna',
      tag: 'PLAYFUL COMPANION',
      description: 'Luna is a gentle calico who offers soft purrs and empathetic listening, perfect for moments when you just need a quiet, steady presence.',
      image: CatImg,
      video: meowVideo,
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      personality: 'You are Luna, a playful, slightly sassy but deeply empathetic cat AI companion. Respond warmly and naturally without roleplay actions or animal sound effects.'
    },
    {
      id: 'dog',
      name: 'Cooper',
      tag: 'LOYAL PROTECTOR',
      description: 'Cooper is a devoted golden retriever who brings boundless warmth and encouragement, acting as a joyful anchor for your emotional well-being.',
      image: DogImg,
      video: arfarfVideo,
      voiceId: 'JBFqnCBsd6RMkjVDRZzb',
      personality: 'You are Cooper, an enthusiastic, loyal dog AI companion. Respond with boundless energy and warmth, without roleplay actions or animal sound effects.'
    }
  ];

  const sanitizeAnimalReply = (text) => {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned.replace(/\*[^*]*\*/g, ' ');
    cleaned = cleaned.replace(/\([^)]*\)/g, ' ');
    cleaned = cleaned.replace(/\b(woof|woofs|meow|meows|bark|barks|arf|purr|purrs|ooh|aah|ook|hoo)\b/gi, ' ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned;
  };

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
      localStorage.setItem(MIC_ACCESS_GUIDE_KEY, '1');
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

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudio = async (blob) => {
    setIsProcessing(true);
    try {
      const audioBase64 = await convertBlobToBase64(blob);

      // Real-time emotion detection for UI
      axiosInstance.post("/emotion-from-voice", { audioBase64 })
        .then(res => {
          if (res.data?.emotion) {
            setDetectedEmotion({
              emotion: res.data.emotion,
              score: res.data.score ?? 0,
              source: "Hume AI"
            });
          }
        })
        .catch(err => console.error("Emotion detection UI error:", err));

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
        
        const newUserMessage = { role: 'user', content: data.text, text: data.text, type: 'user' };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        // Save user message and get AI response from backend
        try {
          const aiRes = await axiosInstance.post(`/messages/process-message/${sessionId}`, {
            message: { text: data.text },
            audioBase64,
            messages: updatedMessages,
            systemPrompt: ANIMAL_GUIDES.find(g => g.id === animalType)?.personality
          });

          const aiMsg = sanitizeAnimalReply(aiRes?.data?.response);
          if (aiMsg) {
            const guide = ANIMAL_GUIDES.find(g => g.id === animalType);
            onTranscript?.(aiMsg, { author: guide.name, source: 'animal' });
            setMessages(prev => [...prev, { role: 'assistant', content: aiMsg, text: aiMsg, type: 'bot' }]);
            await speakText(aiMsg);
          }
        } catch (saveErr) {
          console.error("Failed to process message on backend:", saveErr);
          setError('AI error');
        }
      }
    } catch (e) {
      setError('Transcription failed');
    } finally {
      setIsProcessing(false);
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

      if (!res.ok) {
        let errorMsg = "Failed to generate speech";
        try {
          const errData = await res.json();
          errorMsg = errData.detail?.message || errData.message || errorMsg;
        } catch (jsonErr) {}
        if (res.status === 402) throw new Error("ElevenLabs quota exceeded: " + errorMsg);
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      audioRef.current.src = URL.createObjectURL(blob);
      setIsSpeaking(true);
      audioRef.current.play();
      videoRef.current?.play();
    } catch (e) {
      console.error('Speech error:', e);
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const animalVoiceStyles = {
          cat: { pitch: 1.35, rate: 1.08 },
          dog: { pitch: 0.9, rate: 1.0 },
          monkey: { pitch: 1.2, rate: 1.14 },
          panda: { pitch: 0.82, rate: 0.92 }
        };
        const style = animalVoiceStyles[animalType] || { pitch: 1.0, rate: 1.0 };
        utterance.pitch = style.pitch;
        utterance.rate = style.rate;
        utterance.onstart = () => {
          setIsSpeaking(true);
          videoRef.current?.play();
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          videoRef.current?.pause();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setError(e.message.includes("ElevenLabs quota exceeded") || e.message.includes("paid_plan_required") ? "Out of speech characters." : "Speech failed: " + e.message);
      }
    }
  };

  const handleAudioEnd = () => {
    setIsSpeaking(false);
    videoRef.current?.pause();
  };

  const toggleListening = () => isListening ? stopRecording() : startRecording();

  return (
    <div className="didagent-wrapper">
      {!animalType ? (
        <div className="didagent-selection-container">
          <button className="avatarai-back-btn" onClick={onEnd}>
            <MoveLeft size={16} />
            <span>Back to Selection</span>
          </button>
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
                <div className="didagent-guide-avatar-wrap" style={{ borderRadius: '24px' }}>
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
                  <div className="didagent-hud-status">
                    <span className={`didagent-status-dot ${isSpeaking ? 'speaking' : isProcessing ? 'thinking' : 'online'}`} />
                    {isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Online'}
                  </div>
                </div>
              </div>

              {detectedEmotion && (
                <div className="didagent-emotion-indicator">
                  <Sparkles size={14} />
                  <span>Feeling: <strong>{detectedEmotion.emotion}</strong></span>
                </div>
              )}

              <button className="didagent-change-btn" onClick={() => { setAnimalType(null); setSessionId(null); setSessionStarted(false); setDetectedEmotion(null); }}>
                Change Companion
              </button>
            </div>

            {error && <div className="didagent-error-toast">{error}</div>}

            {/* Floating Controls inside video wrap */}
            <div className="didagent-floating-controls" style={{ zIndex: 100 }}>
              <button
                onClick={toggleListening}
                disabled={isProcessing || isSpeaking}
                className={`didagent-mic-btn ${isListening ? 'active' : ''}`}
              >
                {isListening ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              <button onClick={() => { onEnd?.(); setAnimalType(null); }} className="didagent-end-btn">
                <PhoneOff size={24} />
              </button>
            </div>
          </div>

          <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        </div>
      )}
    </div>
  );
}
