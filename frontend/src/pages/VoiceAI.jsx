import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios.instance";
import { Mic, MicOff, PhoneOff, Sparkles, Zap } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../store/slices/authSlice";
import { useLanguage } from "../context/LanguageContext";
import ReusableModal from "../components/ReusableModal";
import EmotionScoreChart from "../components/EmotionScoreChart";
import useHumeEvi from "../hooks/useHumeEvi";
import "./VoiceAI.css";

const VOICES = [
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    gender: "Man",
    name: "Atlas",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    gradient: "from-indigo-500 to-purple-600",
    desc: "voice_atlas_desc"
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    gender: "Woman",
    name: "Nova",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    gradient: "from-pink-500 to-rose-600",
    desc: "voice_nova_desc"
  },
  {
    id: "iP95p4xoKVk53GoZ742B",
    gender: "Man",
    name: "Orion",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
    gradient: "from-blue-500 to-cyan-600",
    desc: "voice_orion_desc"
  },
  {
    id: "hpp4J3VqNfWAUOO0d1Us",
    gender: "Woman",
    name: "Luna",
    avatar: "https://randomuser.me/api/portraits/women/17.jpg",
    gradient: "from-purple-500 to-fuchsia-600",
    desc: "voice_luna_desc"
  },
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    gender: "Man",
    name: "Sage",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    gradient: "from-green-500 to-emerald-600",
    desc: "voice_sage_desc"
  },
  {
    id: "pFZP5JQG7iQjIQuC4Bku",
    gender: "Woman",
    name: "Ember",
    avatar: "https://randomuser.me/api/portraits/women/31.jpg",
    gradient: "from-orange-500 to-red-600",
    desc: "voice_ember_desc"
  },
];

const getTtsErrorMessage = async (error) => {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      if (text) {
        const parsed = JSON.parse(text);
        return parsed.message || parsed.error || text;
      }
    } catch (_) {
      return error?.message || "Failed to generate speech";
    }
  }

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    "Failed to generate speech"
  );
};

const VoiceAI = () => {
  const { t } = useLanguage();
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
  const [conversationEngine, setConversationEngine] = useState("vera");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMicModal, setShowMicModal] = useState(false);
  const MIC_ACCESS_GUIDE_KEY = 'vera_mic_access_guide_seen';
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
    navigate("/");
  };

  const audioPlayerRef = useRef(null);
  const carouselRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionStartedRef = useRef(false);
  const {
    attachSession: attachEviSession,
    error: eviError,
    expressionScores: eviExpressionScores,
    finalizeSession: finalizeEviSession,
    isMuted: isEviMuted,
    messages: eviMessages,
    start: startEvi,
    status: eviStatus,
    stop: stopEvi,
    toggleMute: toggleEviMute,
  } = useHumeEvi();

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
      const message =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "AI response is temporarily unavailable. Please try again.";
      setSpeechError(message);
      setConversationMode("listening");
      return null;
    }
  };

  const speakText = async (text) => {
    try {
      const voiceId = VOICES[selectedVoiceIndex].id;

      const response = await axiosInstance.post(
        `/elevenlabs/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.38,
            similarity_boost: 0.82,
            style: 0.28,
            use_speaker_boost: true,
          },
        },
        { responseType: "blob", timeout: 90000 }
      );

      const audioBlob = response.data;
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
      const errorMessage = await getTtsErrorMessage(error);
      console.warn("Voice AI TTS fallback:", errorMessage);
      
      // Native Browser TTS Fallback if ElevenLabs fails
      if ('speechSynthesis' in window) {
          setSpeechError(`Using browser voice because ElevenLabs is unavailable: ${errorMessage}`);
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
          alert(errorMessage === "ElevenLabs quota exceeded" ? "Out of ElevenLabs characters" : errorMessage);
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
      setDetectedEmotion(null);
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

  const handleEviCallToggle = async () => {
    if (isCallActive) {
      await finalizeEviSession();
      stopEvi();
      setIsCallActive(false);
      setCallDuration(0);
      return;
    }

    const session = sessionId === null ? await initializeSession() : true;
    if (!session) return;

    const activeSessionId = session.id || sessionId;
    attachEviSession(activeSessionId);
    const started = await startEvi(activeSessionId);
    if (!started) return;

    setSpeechError(null);
    setIsCallActive(true);
  };

  const proceedWithMic = async () => {
    setShowMicModal(false);
    localStorage.setItem(MIC_ACCESS_GUIDE_KEY, '1');
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

        const botResult = await fetchBotResponse(
          userMessage,
          hasValidAudio ? audioBase64 : null
        );
        const botResponse = botResult?.response ?? botResult;
        const voiceEmotion = botResult?.voiceEmotion;
        if (botResult?.responseWarning) {
          setSpeechError(botResult.responseWarning);
        }

        if (botResponse) {
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

          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: botResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

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
      setDetectedEmotion(null);
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
    listening: t("listening"),
    thinking: t("processing"),
    speaking: t("speaking"),
  };
  const isEviMode = conversationEngine === "evi";
  const activeMode = isEviMode ? eviStatus : conversationMode;
  const activeModeLabel = modeLabel[activeMode] || (
    activeMode === "connecting" ? "Connecting" : "Connected"
  );
  const toggleActiveCall = isEviMode ? handleEviCallToggle : handleCallToggle;
  const activeError = isEviMode ? eviError : speechError;
  const emotionScores = isEviMode
    ? eviExpressionScores
    : detectedEmotion?.rawScores || {};
  const hasEmotionScores = Object.keys(emotionScores).length > 0;

  const tokens = user?.tokens ?? 0;
  const SESSION_COST = 2;
  const hasEnoughTokens = tokens >= SESSION_COST;

  if (!user) {
    return (
      <div className="voice-ai-container">
        <ReusableModal
          isOpen={showLoginModal}
          onClose={handleCloseModal}
          title={t("login_required_title")}
          message={t("login_required_desc")}
          type="error"
        />
      </div>
    );
  }

  return (
    <div className="voice-ai-container">
      {/* ── Page Header ── */}
      <div className="voice-ai-page-header">
        <div className="page-eyebrow">
          <span>🎙️</span> {t("voice_companion")}
        </div>
        <h1>
          {t("home")} <em>{t("inner_peace")}</em>
        </h1>
        <p className="page-subtitle">
          {t("connect_voice")}
        </p>
      </div>

      <div className="voice-ai-content-main">
        {!hasEnoughTokens && !isCallActive ? (
          /* ── Insufficient Tokens Screen ── */
          <div className="insufficient-tokens-gate">
            <div className="gate-icon">
              <Zap size={48} className="zap-icon" />
            </div>
            <h2 className="gate-title">{t("tokens_required")}</h2>
            <p className="gate-text" dangerouslySetInnerHTML={{ __html: t("tokens_gate_desc").replace("{cost}", SESSION_COST).replace("{tokens}", tokens) }} />
            <div className="gate-actions">
              <button className="earn-tokens-btn" onClick={() => window.location.href = "/activities"}>
                <span>{t("go_activities")}</span>
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
            <div className="voice-engine-selector" role="group" aria-label="Voice engine">
              <button
                type="button"
                className={conversationEngine === "vera" ? "active" : ""}
                onClick={() => setConversationEngine("vera")}
              >
                Vera pipeline
                <small>ElevenLabs + Vera AI + Hume Prosody</small>
              </button>
              <button
                type="button"
                className={conversationEngine === "evi" ? "active" : ""}
                onClick={() => setConversationEngine("evi")}
              >
                Hume EVI
                <small>Real-time empathic speech-to-speech</small>
              </button>
            </div>

            {isEviMode && (
              <p className="evi-mode-note">
                EVI handles listening, expression analysis, response generation, and
                voice output as one live conversation. The voice configured in Hume is
                used instead of the ElevenLabs voice below.
              </p>
            )}

            <div className="section-title-wrap">
              <h2 className="section-title">{t("select_companion")}</h2>
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
                    {selectedVoiceIndex === index && <div className="active-badge">{t("selected")}</div>}
                  </div>
                  <div className="card-info">
                    <div className="card-header">
                      <h3>{voice.name}</h3>
                      <span className="gender-tag">{voice.gender}</span>
                    </div>
                    <p className="card-desc">{t(voice.desc)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="start-call-footer">
              <button className="premium-start-btn" onClick={toggleActiveCall}>
                <div className="btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 12H8.5L7 14V10l1.5-2H11l1.5 2v4l-1.5 2zm7-3h-1v1h1v2h-2v-2h1v-1h-1V9h2v2h-1v1h1v2z"/>
                  </svg>
                </div>
                <span>
                  {isEviMode && eviStatus === "connecting"
                    ? "Connecting to Hume EVI..."
                    : t("start_voice_session")}
                </span>
              </button>
            </div>

            {isEviMode && activeError && (
              <div className="evi-start-error" role="alert">
                {activeError}
              </div>
            )}
          </div>
        ) : (
          /* ── Immersive Call View ── */
          <div className="immersive-call-view">
            <div className="call-header">
              <div className="call-info">
                <div className="live-tag">{t("live_session")}</div>
                <div className="call-timer">{formatDuration(callDuration)}</div>
              </div>
              <button className="end-session-btn" onClick={toggleActiveCall}>
                <PhoneOff size={18} />
                <span>{t("end_session")}</span>
              </button>
            </div>

            <div className="call-main-content">
              {/* Avatar Section */}
              <div className="avatar-interaction-zone">
                <div className={`avatar-container ${activeMode === "speaking" ? "is-speaking" : ""}`}>
                  <div className="avatar-glow"></div>
                  <div className="avatar-image-mask">
                    <img src={VOICES[selectedVoiceIndex].avatar} alt={VOICES[selectedVoiceIndex].name} />
                  </div>
                  {activeMode === "speaking" && (
                    <div className="voice-waves">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  )}
                </div>
                
                <div className="companion-meta">
                  <h2 className="companion-name">{VOICES[selectedVoiceIndex].name}</h2>
                  <p className="companion-status">
                    {activeModeLabel}
                  </p>
                </div>

              </div>

              {/* Interaction Panel */}
              <div className="interaction-panel">
                <div className="transcript-container">
                  <div className="transcript-label">Live Transcription</div>
                  <div className="transcript-content">
                    {isEviMode && eviMessages.length > 0 ? (
                      <div className="evi-transcript-list">
                        {eviMessages.slice(-6).map((message) => (
                          <p
                            key={message.id}
                            className={`evi-transcript-message ${message.role} ${
                              message.interim ? "interim" : ""
                            }`}
                          >
                            <strong>{message.role === "user" ? "You" : "Vera"}:</strong>{" "}
                            {message.text}
                          </p>
                        ))}
                      </div>
                    ) : transcript && !isEviMode ? (
                      <p className="active-transcript">{transcript}</p>
                    ) : (
                      <p className="transcript-placeholder">
                        {activeMode === "connecting"
                          ? "Connecting to Hume EVI..."
                          : activeMode === "thinking"
                            ? t("processing")
                            : t("listening")}
                      </p>
                    )}
                  </div>
                  {activeMode === "thinking" && (
                    <div className="thinking-loader">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>

                <section
                  className={`voice-emotion-panel ${hasEmotionScores ? "has-results" : ""}`}
                  aria-live="polite"
                >
                  <div className="voice-emotion-panel-header">
                    <div className="voice-emotion-panel-title">
                      <Sparkles size={17} />
                      <span>Voice Emotion Analysis</span>
                    </div>
                    <span className="voice-emotion-provider">Hume AI</span>
                  </div>

                  {hasEmotionScores ? (
                    <EmotionScoreChart scores={emotionScores} />
                  ) : !isEviMode && detectedEmotion?.error ? (
                    <p className="voice-emotion-message error" role="alert">
                      {detectedEmotion.error}
                    </p>
                  ) : activeMode === "thinking" ? (
                    <div className="voice-emotion-analyzing">
                      <span></span><span></span><span></span>
                      <p>Analyzing your vocal expression...</p>
                    </div>
                  ) : (
                    <p className="voice-emotion-message">
                      {isEviMode
                        ? "Start speaking to see live vocal expression scores."
                        : isRecording
                          ? "Listening now. Tap Stop & Analyze when you finish speaking."
                          : "Tap the microphone, speak naturally, then tap Stop & Analyze to view the result."}
                    </p>
                  )}

                  <small className="emotion-disclaimer">
                    Hume analyzes voice patterns only. Results are model estimates,
                    not verified emotions or diagnostic findings.
                  </small>
                </section>

                <div className="call-controls">
                  <button 
                    className={`circle-btn mute ${(isEviMode ? isEviMuted : isMuted) ? 'active' : ''}`}
                    onClick={isEviMode ? toggleEviMute : handleMuteToggle}
                    title={(isEviMode ? isEviMuted : isMuted) ? "Unmute" : "Mute"}
                  >
                    {(isEviMode ? isEviMuted : isMuted) ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>

                  <button 
                    className={`main-action-btn ${(isEviMode || isRecording) ? 'is-recording' : ''}`}
                    onClick={isEviMode ? undefined : handleRecordingToggle}
                    disabled={isEviMode || conversationMode === "thinking" || conversationMode === "speaking"}
                  >
                    <div className="btn-inner">
                      {isEviMode ? (
                        <div className="mic-pulse">
                          <Mic size={32} />
                        </div>
                      ) : isRecording ? (
                        <div className="stop-square"></div>
                      ) : (
                        <div className="mic-pulse">
                          <Mic size={32} />
                        </div>
                      )}
                    </div>
                    <span className="btn-label">
                      {isEviMode
                        ? activeModeLabel
                        : isRecording
                          ? t("stop_process")
                          : t("tap_to_speak")}
                    </span>
                  </button>

                  <div className="volume-indicator">
                    <div className="vol-bar"></div>
                    <div className="vol-bar"></div>
                    <div className="vol-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            {activeError && (
              <div className="call-error-toast">
                <span>⚠️</span> {activeError}
              </div>
            )}
          </div>
        )}
      </div>

      {showMicModal && (
        <ReusableModal
          isOpen={showMicModal}
          onClose={() => setShowMicModal(false)}
          title="Microphone Access Required"
          type="confirm"
          position="fixed"
        >
          <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <p className="text-slate-600 text-center leading-relaxed" style={{ color: '#475569', textAlign: 'center' }}>
              Vera needs access to your microphone so you can converse with your AI companion. 
              Please click "Allow" when your browser prompts you.
            </p>
            <button 
              onClick={proceedWithMic} 
              style={{ width: '100%', padding: '16px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '24px', fontWeight: 'bold' }}
            >
              Continue & Allow
            </button>
          </div>
        </ReusableModal>
      )}
    </div>
  );
};

export default VoiceAI;
