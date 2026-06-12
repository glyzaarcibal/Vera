import React, { useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, PawPrint, Heart, Sparkles, MoveLeft } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateTokens } from '../store/slices/authSlice';
import './AvatarAI.css';
import meowVideo from '../assets/meow+meow+.mp4';
import arfarfVideo from '../assets/++arf+arf+.mp4';
import monkeyVideo from '../assets/monkey.mp4';
import pandaVideo from '../assets/panda.mp4';
import CatImg from '../assets/cat_companion.png';
import DogImg from '../assets/dog_companion.png';
import MonkeyImg from '../assets/monkey.jpg';
import PandaImg from '../assets/panda.png';
import axiosInstance from '../utils/axios.instance';
import ReusableModal from "../components/ReusableModal";
import EmotionScoreChart from '../components/EmotionScoreChart';

export default function AnimalAI({ onTranscript, onEnd, setSessionStarted }) {
  const [animalType, setAnimalType] = useState(null); 
  const [showMicModal, setShowMicModal] = useState(false);
  const MIC_ACCESS_GUIDE_KEY = 'vera_mic_access_guide_seen';
  const [isSessionActive, setIsSessionActive] = useState(false);
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

  const ANIMAL_GUIDES = [
    {
      id: 'cat',
      name: 'Luna',
      tag: 'PLAYFUL COMPANION',
      description: 'Luna is a gentle calico who offers soft purrs and empathetic listening, perfect for moments when you just need a quiet, steady presence.',
      image: CatImg,
      video: meowVideo,
      voiceId: 'cgSgspJ2msm6clMCkdW9',
      voiceSettings: {
        stability: 0.28,
        similarity_boost: 0.88,
        style: 0.55,
        use_speaker_boost: true,
      },
      personality: 'You are Luna, a gentle female cat AI companion with a soft, affectionate, malambing voice. Respond warmly and naturally with tender, cat-like sweetness, without sounding robotic and without roleplay actions or animal sound effects.'
    },
    {
      id: 'dog',
      name: 'Cooper',
      tag: 'LOYAL PROTECTOR',
      description: 'Cooper is a devoted golden retriever who brings boundless warmth and encouragement, acting as a joyful anchor for your emotional well-being.',
      image: DogImg,
      video: arfarfVideo,
      voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
      voiceSettings: {
        stability: 0.3,
        similarity_boost: 0.82,
        style: 0.62,
        use_speaker_boost: true,
      },
      personality: 'You are Cooper, an enthusiastic male dog AI companion with a bright, hyper, loyal energy. Respond warmly, naturally, and playfully without sounding robotic, and without roleplay actions or animal sound effects.'
    },
    {
      id: 'monkey',
      name: 'Miko',
      tag: 'PLAYFUL ENERGIZER',
      description: 'Miko is a cheerful monkey companion who brings humor, lightness, and upbeat encouragement during stressful moments.',
      image: MonkeyImg,
      video: monkeyVideo,
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      voiceSettings: {
        stability: 0.34,
        similarity_boost: 0.82,
        style: 0.35,
        use_speaker_boost: true,
      },
      personality: 'You are Miko, a playful and caring monkey AI companion. Be warm, funny, and reassuring with gentle energy, without roleplay actions or animal sound effects.'
    },
    {
      id: 'panda',
      name: 'Poko',
      tag: 'CALM COMFORTER',
      description: 'Poko is a gentle panda companion that offers calm reassurance, soft grounding prompts, and cozy emotional support.',
      image: PandaImg,
      video: pandaVideo,
      voiceId: 'ErXwobaYiN019PkySvjV',
      voiceSettings: {
        stability: 0.45,
        similarity_boost: 0.78,
        style: 0.18,
        use_speaker_boost: true,
      },
      personality: 'You are Poko, a calm and kind panda AI companion. Speak softly and supportively, and help the user feel safe and steady, without roleplay actions or animal sound effects.'
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
      const status = await navigator.permissions.query({ name: 'microphone' });
      if (status.state === 'prompt') {
        const hasSeenGuide = localStorage.getItem(MIC_ACCESS_GUIDE_KEY) === '1';
        if (hasSeenGuide) {
          proceedWithMic();
          return;
        }
        setShowMicModal(true);
        return;
      }
      proceedWithMic();
    } catch (e) {
      setShowMicModal(true);
    }
  };

  const proceedWithMic = async () => {
    setShowMicModal(false);
    localStorage.setItem(MIC_ACCESS_GUIDE_KEY, '1');
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

      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model_id', 'scribe_v2');
      const res = await axiosInstance.post('/elevenlabs/speech-to-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      const data = res.data;
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
          const voiceEmotion = aiRes?.data?.voiceEmotion;
          if (
            voiceEmotion?.emotion ||
            voiceEmotion?.error ||
            Object.keys(voiceEmotion?.rawScores || {}).length > 0
          ) {
            setDetectedEmotion({
              emotion: voiceEmotion.toneLabel || voiceEmotion.emotion || null,
              score: voiceEmotion.score ?? 0,
              rawScores: voiceEmotion.rawScores || {},
              source: voiceEmotion.source || "Hume AI",
              error: voiceEmotion.error,
            });
          }

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
      const res = await axiosInstance.post(
        `/elevenlabs/text-to-speech/${guide.voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: guide.voiceSettings,
        },
        { responseType: 'blob', timeout: 90000 }
      );

      const blob = res.data;
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
          cat: { pitch: 1.28, rate: 0.94 },
          dog: { pitch: 1.04, rate: 1.1 },
          monkey: { pitch: 1.2, rate: 1.14 },
          panda: { pitch: 0.82, rate: 0.92 }
        };
        const browserVoices = window.speechSynthesis.getVoices?.() || [];
        const softFemaleVoice = browserVoices.find((voice) =>
          /female|woman|zira|susan|samantha|victoria|karen|moira/i.test(voice.name)
        );
        const upbeatMaleVoice = browserVoices.find((voice) =>
          /male|man|david|mark|daniel|alex|fred|george|liam/i.test(voice.name)
        );
        if (animalType === 'cat' && softFemaleVoice) {
          utterance.voice = softFemaleVoice;
        }
        if (animalType === 'dog' && upbeatMaleVoice) {
          utterance.voice = upbeatMaleVoice;
        }
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

          <div className="didagent-guide-grid" style={{ maxWidth: '900px', margin: '0 auto 80px' }}>
            {ANIMAL_GUIDES.map((guide) => (
              <div key={guide.id} className="didagent-guide-card">
                <div className="didagent-guide-avatar-wrap" style={{ borderRadius: '24px' }}>
                  <img src={guide.image} alt={guide.name} className="didagent-guide-avatar" />
                </div>
                <h3 className="didagent-guide-name">{guide.name}</h3>
                <div
                  className="didagent-guide-tag"
                  style={{
                    background:
                      guide.id === 'cat' ? '#fdf2f8' :
                      guide.id === 'dog' ? '#fff7ed' :
                      guide.id === 'monkey' ? '#eff6ff' : '#ecfdf5',
                    color:
                      guide.id === 'cat' ? '#db2777' :
                      guide.id === 'dog' ? '#ea580c' :
                      guide.id === 'monkey' ? '#1d4ed8' : '#047857'
                  }}
                >
                  {guide.tag}
                </div>
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
        <div
          className={`didagent-session-container ${
            Object.keys(detectedEmotion?.rawScores || {}).length > 0
              ? 'has-emotion-panel'
              : ''
          }`}
        >
          <div className="didagent-video-wrap">
            <video
              ref={videoRef}
              src={ANIMAL_GUIDES.find(g => g.id === animalType)?.video}
              poster={ANIMAL_GUIDES.find(g => g.id === animalType)?.image}
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

          {Object.keys(detectedEmotion?.rawScores || {}).length > 0 && (
            <aside className="didagent-emotion-panel">
              <div className="didagent-emotion-panel-title">
                <Sparkles size={16} />
                <span>Voice Emotion Analysis</span>
              </div>
              <EmotionScoreChart scores={detectedEmotion.rawScores} />
              <small className="didagent-emotion-disclaimer">
                Hume AI analyzes voice patterns only. This is not 100% accurate and does not detect your true emotion.
              </small>
            </aside>
          )}

          <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />
        </div>
      )}

      {showMicModal && (
        <ReusableModal
          isOpen={showMicModal}
          onClose={() => setShowMicModal(false)}
          title="Microphone Access Required"
          type="confirm"
          position="fixed"
        >
          <div className="flex flex-col gap-6">
            <p className="text-slate-600 text-center leading-relaxed">
              Vera needs access to your microphone so you can converse with your AI companion. 
              Please click "Allow" when your browser prompts you.
            </p>
            <button 
              onClick={proceedWithMic} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Continue & Allow
            </button>
          </div>
        </ReusableModal>
      )}
    </div>
  );
}
