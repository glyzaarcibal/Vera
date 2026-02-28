import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios.instance";
import "./VoiceAI.css";

const VOICES = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    gender: "Man",
    name: "Atlas",
    avatar: "🎙️",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    gender: "Woman",
    name: "Nova",
    avatar: "✨",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    gender: "Man",
    name: "Orion",
    avatar: "🔮",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    gender: "Woman",
    name: "Luna",
    avatar: "🌙",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    gender: "Man",
    name: "Sage",
    avatar: "🍃",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    gender: "Woman",
    name: "Ember",
    avatar: "🔥",
    gradient: "from-orange-500 to-red-600",
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
        } catch (_) {}
      };
    }
  }, []);

  const initializeSession = async () => {
    try {
      const res = await axiosInstance.post(
        `/sessions/start-session/${"voice"}`,
        { voice: VOICES[selectedVoiceIndex] }
      );
      const { session } = res.data;
      setSessionId(session.id);
      return session;
    } catch (e) {
      const message =
        e.response?.data?.message || e.message || "Internal Server Error";
      const status = e.response?.status;
      if (status === 503) {
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

      if (!response.ok) throw new Error("Failed to generate speech");

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
      alert("Failed to generate speech");
      setConversationMode("listening");
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
              .catch(() => {});
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

  return (
    <div className="voice-ai-container flex flex-col items-center">
      {/* ── Page Header ── */}
      <div className="voice-ai-page-header w-full">
        <div className="page-eyebrow">
          <span>🎙️</span> Voice Companion
        </div>
        <h1>
          Talk with your <em>AI therapist</em>
        </h1>
        <p className="page-subtitle">
          Choose a voice and start a natural, private conversation
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-8">
        {/* ── Main Card ── */}
        <div className="w-full">
          {!isCallActive ? (
            /* ── Voice Carousel ── */
            <div className="design-section voice-carousel-card w-full p-8 sm:p-12">
              <p className="text-center text-xs font-bold tracking-widest uppercase text-purple-400 mb-8">
                Select a Voice
              </p>
              <div className="relative w-full flex items-center justify-center">
                {/* Left Arrow */}
                <button
                  onClick={() => handleCarouselScroll("left")}
                  disabled={selectedVoiceIndex === 0}
                  className={`absolute left-0 z-20 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center transition-all border border-gray-100 ${
                    selectedVoiceIndex === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:scale-110 hover:shadow-lg text-purple-600"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Carousel */}
                <div className="relative w-full h-80 flex items-center justify-center overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="absolute flex items-center gap-10 transition-transform duration-500 ease-out"
                    style={{
                      transform: `translateX(calc(50% - ${
                        selectedVoiceIndex * 232 + 96
                      }px))`,
                    }}
                  >
                    {VOICES.map((voice, index) => {
                      const isActive = index === selectedVoiceIndex;
                      return (
                        <div
                          key={voice.id}
                          onClick={() => handleVoiceSelect(index)}
                          className={`relative flex-shrink-0 w-44 h-60 rounded-3xl cursor-pointer flex flex-col items-center justify-center gap-4 transition-all duration-500 ${
                            isActive
                              ? "voice-card-active scale-110"
                              : "voice-card-inactive scale-90 opacity-40 blur-[1px] hover:opacity-60"
                          }`}
                        >
                          <div
                            className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl shadow-md ${
                              isActive
                                ? "bg-white/20"
                                : "bg-gray-50 border border-gray-100"
                            }`}
                          >
                            {voice.avatar}
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                                isActive ? "text-white/60" : "text-gray-400"
                              }`}
                            >
                              {voice.gender}
                            </p>
                            <p
                              className={`text-base font-bold ${
                                isActive ? "text-white" : "text-gray-700"
                              }`}
                            >
                              {voice.name}
                            </p>
                          </div>
                          {isActive && (
                            <div className="absolute top-4 right-4">
                              <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => handleCarouselScroll("right")}
                  disabled={selectedVoiceIndex === VOICES.length - 1}
                  className={`absolute right-0 z-20 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center transition-all border border-gray-100 ${
                    selectedVoiceIndex === VOICES.length - 1
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:scale-110 hover:shadow-lg text-purple-600"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* Voice name + dot indicators */}
              <div className="flex flex-col items-center gap-3 mt-6">
                <p className="text-sm font-semibold text-gray-600">
                  {VOICES[selectedVoiceIndex].name} ·{" "}
                  <span className="text-purple-500">
                    {VOICES[selectedVoiceIndex].gender}
                  </span>
                </p>
                <div className="flex gap-2">
                  {VOICES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleVoiceSelect(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === selectedVoiceIndex
                          ? "w-5 h-2 bg-purple-500"
                          : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Active Call View ── */
            <div className="design-section active-call-section w-full max-w-2xl mx-auto py-12 px-8 flex flex-col items-center gap-8">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 w-full call-progress-bar rounded-t-3xl">
                <div className="bar-fill" />
              </div>

              {/* Avatar */}
              <div
                className={`voice-avatar-orb w-36 h-36 rounded-full flex items-center justify-center text-5xl relative ${
                  conversationMode === "speaking" ? "speaking" : ""
                }`}
              >
                {VOICES[selectedVoiceIndex].avatar}
                {conversationMode === "speaking" && (
                  <div className="ping-ring absolute inset-0 rounded-full" />
                )}
              </div>

              {/* Name + timer */}
              <div className="text-center flex flex-col items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">
                  {VOICES[selectedVoiceIndex].name}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="status-dot" />
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <span className="text-xs text-purple-500 font-medium">
                  {modeLabel[conversationMode] || "Active"}
                </span>
              </div>

              {/* Detected emotion */}
              {detectedEmotion?.emotion && (
                <div className="emotion-badge">
                  <span>💫</span>
                  <span>
                    {detectedEmotion.emotion}
                    {detectedEmotion.score
                      ? ` · ${Math.round(detectedEmotion.score * 100)}%`
                      : ""}
                  </span>
                </div>
              )}

              {/* Transcript */}
              <div className="transcript-box w-full p-6 min-h-[96px] flex flex-col items-center justify-center text-center">
                <p
                  className={`text-base leading-relaxed ${
                    transcript ? "text-gray-800 font-medium" : "text-gray-400 italic"
                  }`}
                >
                  {transcript ||
                    (conversationMode === "thinking"
                      ? "Processing your message…"
                      : "Listening for your voice…")}
                </p>
                {conversationMode === "thinking" && (
                  <div className="flex gap-1.5 mt-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="thinking-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {speechError && (
                <p className="text-xs text-rose-500 text-center px-4">
                  ⚠️ {speechError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="flex gap-4 items-center">
          {isCallActive && (
            <div className="call-controls-bar">
              {/* Mute */}
              <button
                onClick={handleMuteToggle}
                className={`ctrl-btn ${isMuted ? "muted" : "unmuted"}`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  {isMuted ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </>
                  )}
                </svg>
              </button>

              {/* Record toggle */}
              <button
                onClick={handleRecordingToggle}
                disabled={
                  conversationMode === "thinking" ||
                  conversationMode === "speaking"
                }
                className={`ctrl-btn ${isRecording ? "recording" : "idle-record"}`}
                title={isRecording ? "Send message" : "Start speaking"}
              >
                {isRecording ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />
                )}
              </button>
            </div>
          )}

          {/* Main call button */}
          <button
            onClick={handleCallToggle}
            className={`call-btn ${isCallActive ? "end" : "start"}`}
            title={isCallActive ? "End call" : "Start call"}
          >
            {isCallActive ? (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            ) : (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Debug transcript ── */}
        {isTesting && isCallActive && (
          <div className="debug-section design-section p-6">
            <p className="debug-label">Speech-to-Text Debug Output</p>
            <textarea
              className="debug-textarea"
              value={transcript}
              readOnly
              placeholder="Real-time transcription will appear here…"
              rows="4"
            />
          </div>
        )}

        {/* ── Feature Cards ── */}
        {!isCallActive && (
          <div className="feature-grid">
            {[
              {
                icon: "🎙️",
                title: "Voice Chat",
                desc: "Natural voice conversation with your AI",
              },
              {
                icon: "💡",
                title: "Live Support",
                desc: "Real-time guidance & emotional support",
              },
              {
                icon: "🛡️",
                title: "Private",
                desc: "Secure, confidential interactions",
              },
            ].map((f, i) => (
              <div key={i} className="design-section feature-card">
                <div className="icon-wrap">{f.icon}</div>
                <div>
                  <p className="feat-title">{f.title}</p>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAI;