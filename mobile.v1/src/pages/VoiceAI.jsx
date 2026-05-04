import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios.instance";
import { Mic, MicOff, PhoneOff, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../store/slices/authSlice";
import "./VoiceAI.css";

const VOICES = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    gender: "Man",
    name: "Atlas",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    gradient: "from-indigo-500 to-purple-600",
    desc: "Calm & mature, specializing in serious, structured advice."
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    gender: "Woman",
    name: "Nova",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    gradient: "from-pink-500 to-rose-600",
    desc: "Warm & empathetic, focusing on emotional support and care."
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    gender: "Man",
    name: "Orion",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    gradient: "from-blue-500 to-cyan-600",
    desc: "Supportive & trustworthy, a relatable voice for daily check-ins."
  },
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    gender: "Woman",
    name: "Luna",
    avatar: "https://randomuser.me/api/portraits/women/17.jpg",
    gradient: "from-purple-500 to-fuchsia-600",
    desc: "Serene & gentle, perfect for relaxation and mindfulness."
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    gender: "Man",
    name: "Sage",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    gradient: "from-green-500 to-emerald-600",
    desc: "Wise & mentor-like, providing deep philosophical insights."
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    gender: "Woman",
    name: "Ember",
    avatar: "https://randomuser.me/api/portraits/women/31.jpg",
    gradient: "from-orange-500 to-red-600",
    desc: "Energetic & friendly, your optimistic partner for life coaching."
  },
];

const VoiceAI = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTesting, setIsTesting] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationMode, setConversationMode] = useState("listening");
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [speechError, setSpeechError] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const dispatch = useDispatch();
  const audioPlayerRef = useRef(null);
  const carouselRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionStartedRef = useRef(false);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";
      // Disable filtering of critical words for raw emotion detection
      recognitionInstance.profanityFilter = false;

      recognitionInstance.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + " ";
          } else {
            interimTranscript += transcriptPiece;
          }
        }
        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        const message =
          event.error === "network"
            ? "Check your internet connection. Speech recognition needs network access."
            : event.error === "not-allowed"
              ? "Microphone access was denied."
              : event.error === "no-speech"
                ? "No speech detected. Try again."
                : event.error === "audio-capture"
                  ? "No microphone found."
                  : `Speech recognition error: ${event.error}. You can still type below.`;
        setSpeechError(message);
      };

      recognitionInstance.onend = () => {
        recognitionStartedRef.current = false;
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);

      return () => {
        recognitionStartedRef.current = false;
        try {
          recognitionInstance.stop();
        } catch (_) { }
      };
    }
  }, []);

  const initializeSession = async () => {
    try {
      const res = await axiosInstance.post(
        `/sessions/start-session/${"voice"}`,
        { voice: VOICES[selectedVoiceIndex] }
      );
      const { session, updatedTokens } = res.data;
      
      if (updatedTokens !== null) {
        dispatch(updateTokens(updatedTokens));
      }

      setSessionId(session.id);
      return session;
    } catch (e) {
      const message =
        e.response?.data?.message || e.message || "Internal Server Error";
      const status = e.response?.status;
      if (status === 401) {
        alert("Your session has expired or you are not logged in. Please log in to continue.");
        window.location.href = "/";
      } else if (status === 503) {
        alert("Service temporarily unavailable. " + message);
      } else {
        alert(message);
      }
    }
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

  const fetchBotResponse = async (message, audioBase64) => {
    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${sessionId}`,
        { message, messages, audioBase64 }
      );
      return res.data;
    } catch (e) {
      alert("Internal Server Error");
      return null;
    }
  };

  const speakText = async (text) => {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      const voiceId = VOICES[selectedVoiceIndex].id;

      if (!apiKey) {
        alert(
          "ElevenLabs API key is not configured. Please check your .env file and restart the dev server."
        );
        setConversationMode("listening");
        return;
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("ElevenLabs API key is invalid or unauthorized.");
        }
        if (response.status === 402) {
          throw new Error("ElevenLabs quota exceeded");
        }
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onended = () => {
        setConversationMode("listening");
        URL.revokeObjectURL(audioUrl);
        audioPlayerRef.current = null;
      };

      audio.play();
    } catch (error) {
      console.error('Voice AI TTS error:', error);
      
      // Native Browser TTS Fallback if ElevenLabs fails
      if ('speechSynthesis' in window) {
          console.log("ElevenLabs failed, falling back to browser Web Speech API...");
          const utterance = new SpeechSynthesisUtterance(text);
          const voiceDef = VOICES[selectedVoiceIndex];
          
          if (voiceDef.gender === 'Woman') {
              utterance.pitch = 1.2;
          } else {
              utterance.pitch = 0.9;
          }
          
          utterance.onend = () => {
              setConversationMode("listening");
          };
          
          window.speechSynthesis.speak(utterance);
      } else {
          alert(error.message === "ElevenLabs quota exceeded" ? "Out of ElevenLabs characters" : error.message || "Failed to generate speech");
          setConversationMode("listening");
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCallToggle = async () => {
    if (sessionId === null) await initializeSession();
    setIsCallActive(!isCallActive);
    if (!isCallActive) {
      setIsListening(true);
      setTranscript("");
      setSpeechError(null);
      if (recognition) {
        try {
          if (!recognitionStartedRef.current) {
            recognition.start();
            recognitionStartedRef.current = true;
          }
          setIsRecording(true);
        } catch (err) {
          if (err.name === "InvalidStateError") {
            recognitionStartedRef.current = false;
          }
        }
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        alert("Failed to access microphone");
      }
    } else {
      setIsListening(false);
      setIsMuted(false);
      if (recognition && isRecording) {
        recognitionStartedRef.current = false;
        recognition.stop();
        setIsRecording(false);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
  };

  const handleMuteToggle = () => setIsMuted(!isMuted);

  const handleRecordingToggle = async () => {
    if (isRecording) {
      recognitionStartedRef.current = false;
      recognition.stop();

      let chunks = [];
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        await new Promise((resolve) => {
          const mr = mediaRecorderRef.current;
          mr.onstop = resolve;
          mr.stop();
        });
        chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        if (streamRef.current) {
          const mr = new MediaRecorder(streamRef.current);
          mr.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mr.start();
          mediaRecorderRef.current = mr;
        }
      }

      setIsRecording(false);
      setIsListening(false);

      if (transcript.trim()) {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioBase64 = await convertBlobToBase64(audioBlob);
        const hasValidAudio =
          typeof audioBase64 === "string" && audioBase64.length > 100;

        const userMessage = {
          id: messages.length + 1,
          type: "user",
          text: transcript.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setConversationMode("thinking");

        if (hasValidAudio) {
          axiosInstance
            .post("/emotion-from-voice", { audioBase64 }, { timeout: 90000 })
            .then((res) => {
              const d = res.data;
              if (d?.emotion) {
                setDetectedEmotion({
                  emotion: d.emotion,
                  score: d.score ?? 0,
                  source: d?.source || "Hume AI",
                });
              } else if (d?.error) {
                setDetectedEmotion({
                  emotion: null,
                  score: 0,
                  source: "Hume AI",
                  error: d.error,
                });
              }
            })
            .catch((e) => {
              const msg =
                e.response?.data?.error ??
                e.response?.data?.message ??
                (e.code === "ECONNABORTED"
                  ? "Request timed out"
                  : "Unavailable");
              setDetectedEmotion({
                emotion: null,
                score: 0,
                source: "Hume AI",
                error: msg,
              });
            });
        }

        const botResult = await fetchBotResponse(
          userMessage,
          hasValidAudio ? audioBase64 : null
        );
        const botResponse = botResult?.response ?? botResult;
        const messageId = botResult?.messageId ?? botResult?.message_id;

        if (botResponse) {
          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: botResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

          if (messageId && hasValidAudio && audioBase64) {
            axiosInstance
              .post("/emotion-from-voice", { audioBase64, messageId })
              .catch(() => { });
          }

          setConversationMode("speaking");
          await speakText(botResponse);
        } else {
          setConversationMode("listening");
        }

        setTranscript("");
        audioChunksRef.current = [];
      }
    } else {
      setSpeechError(null);
      try {
        if (!recognitionStartedRef.current) {
          recognition.start();
          recognitionStartedRef.current = true;
        }
      } catch (err) {
        if (err.name === "InvalidStateError") {
          recognitionStartedRef.current = false;
        }
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "paused"
      ) {
        mediaRecorderRef.current.resume();
      }

      setIsRecording(true);
      setIsListening(true);
      setConversationMode("listening");
    }
  };

  const handleVoiceSelect = (index) => setSelectedVoiceIndex(index);

  const handleCarouselScroll = (direction) => {
    const newIndex =
      direction === "left"
        ? Math.max(0, selectedVoiceIndex - 1)
        : Math.min(VOICES.length - 1, selectedVoiceIndex + 1);
    setSelectedVoiceIndex(newIndex);
  };

  const modeLabel = {
    listening: "Listening…",
    thinking: "Processing…",
    speaking: "Speaking…",
  };

  const user = useSelector((state) => state.auth.user);
  const tokens = user?.tokens ?? 0;
  const SESSION_COST = 2;
  const hasEnoughTokens = tokens >= SESSION_COST;

  return (
    <div className="voice-ai-container">
      {/* ── Page Header ── */}
      <div className="voice-ai-page-header">
        <div className="page-eyebrow">
          <span>🎙️</span> AI Voice Companion
        </div>
        <h1>
          Your Journey to <em>Inner Peace</em>
        </h1>
        <p className="page-subtitle">
          Connect with a natural AI personality tailored to your needs.
        </p>
      </div>

      <div className="voice-ai-content-main">
        {!hasEnoughTokens && !isCallActive ? (
          /* ── Insufficient Tokens Screen ── */
          <div className="insufficient-tokens-gate">
            <div className="gate-icon">
              <Zap size={48} className="zap-icon" />
            </div>
            <h2 className="gate-title">Tokens Required</h2>
            <p className="gate-text">
              You need at least <strong>{SESSION_COST} tokens</strong> to start a voice session. 
              You currently have <strong>{tokens} tokens</strong>.
            </p>
            <div className="gate-actions">
              <button className="earn-tokens-btn" onClick={() => window.location.href = "/activities"}>
                <span>Go to Activities</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
            <p className="gate-hint">Complete daily activities like Breathing exercises or Mood tracking to earn more tokens!</p>
          </div>
        ) : !isCallActive ? (
          /* ── Voice Selection Grid ── */
          <div className="voice-selection-layout">
            <div className="section-title-wrap">
              <h2 className="section-title">Select Your Companion</h2>
              <div className="title-divider"></div>
            </div>
            
            <div className="voice-grid">
              {VOICES.map((voice, index) => (
                <div 
                  key={voice.id}
                  className={`voice-selection-card ${selectedVoiceIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedVoiceIndex(index)}
                >
                  <div className="card-avatar-wrap">
                    <img src={voice.avatar} alt={voice.name} />
                    {selectedVoiceIndex === index && <div className="active-badge">Selected</div>}
                  </div>
                  <div className="card-info">
                    <div className="card-header">
                      <h3>{voice.name}</h3>
                      <span className="gender-tag">{voice.gender}</span>
                    </div>
                    <p className="card-desc">{voice.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="start-call-footer">
              <button className="premium-start-btn" onClick={handleCallToggle}>
                <div className="btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 12H8.5L7 14V10l1.5-2H11l1.5 2v4l-1.5 2zm7-3h-1v1h1v2h-2v-2h1v-1h-1V9h2v2h-1v1h1v2z"/>
                  </svg>
                </div>
                <span>Start Voice Session</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Immersive Call View ── */
          <div className="immersive-call-view">
            <div className="call-header">
              <div className="call-info">
                <div className="live-tag">LIVE SESSION</div>
                <div className="call-timer">{formatDuration(callDuration)}</div>
              </div>
              <button className="end-session-btn" onClick={handleCallToggle}>
                <PhoneOff size={18} />
                <span>End Session</span>
              </button>
            </div>

            <div className="call-main-content">
              {/* Avatar Section */}
              <div className="avatar-interaction-zone">
                <div className={`avatar-container ${conversationMode === "speaking" ? "is-speaking" : ""}`}>
                  <div className="avatar-glow"></div>
                  <div className="avatar-image-mask">
                    <img src={VOICES[selectedVoiceIndex].avatar} alt={VOICES[selectedVoiceIndex].name} />
                  </div>
                  {conversationMode === "speaking" && (
                    <div className="voice-waves">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  )}
                </div>
                
                <div className="companion-meta">
                  <h2 className="companion-name">{VOICES[selectedVoiceIndex].name}</h2>
                  <p className="companion-status">
                    {modeLabel[conversationMode] || "Connected"}
                  </p>
                </div>

                {detectedEmotion?.emotion && (
                  <div className="live-emotion-indicator">
                    <span className="emotion-icon">✨</span>
                    <span className="emotion-text">Feeling: <strong>{detectedEmotion.emotion}</strong></span>
                  </div>
                )}
              </div>

              {/* Interaction Panel */}
              <div className="interaction-panel">
                <div className="transcript-container">
                  <div className="transcript-label">Live Transcription</div>
                  <div className="transcript-content">
                    {transcript ? (
                      <p className="active-transcript">{transcript}</p>
                    ) : (
                      <p className="transcript-placeholder">
                        {conversationMode === "thinking" ? "V.E.R.A is thinking..." : "Listening for your voice..."}
                      </p>
                    )}
                  </div>
                  {conversationMode === "thinking" && (
                    <div className="thinking-loader">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>

                <div className="call-controls">
                  <button 
                    className={`circle-btn mute ${isMuted ? 'active' : ''}`} 
                    onClick={handleMuteToggle}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>

                  <button 
                    className={`main-action-btn ${isRecording ? 'is-recording' : ''}`}
                    onClick={handleRecordingToggle}
                    disabled={conversationMode === "thinking" || conversationMode === "speaking"}
                  >
                    <div className="btn-inner">
                      {isRecording ? (
                        <div className="stop-square"></div>
                      ) : (
                        <div className="mic-pulse">
                          <Mic size={32} />
                        </div>
                      )}
                    </div>
                    <span className="btn-label">{isRecording ? "Stop & Process" : "Tap to Speak"}</span>
                  </button>

                  <div className="volume-indicator">
                    <div className="vol-bar"></div>
                    <div className="vol-bar"></div>
                    <div className="vol-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            {speechError && (
              <div className="call-error-toast">
                <span>⚠️</span> {speechError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAI;