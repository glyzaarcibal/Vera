import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios.instance";
import "./VoiceAI.css";

const VOICES = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    gender: "Man",
    avatar: "V",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    gender: "Woman",
    avatar: "V",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    gender: "Man",
    avatar: "V",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    gender: "Woman",
    avatar: "V",
    gradient: "from-purple-500 to-fuchsia-600",
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    gender: "Man",
    avatar: "V",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    gender: "Woman",
    avatar: "V",
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
      const { session } = res.data;
      setSessionId(session.id);
      return session;
    } catch (e) {
      const message = e.response?.data?.message || e.message || "Internal Server Error";
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
    console.log(message);
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
    console.log("Speaking:", text);
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      const voiceId = VOICES[selectedVoiceIndex].id; // Use selected voice ID

      if (!apiKey) {
        console.error("ElevenLabs API key is missing!");
        alert(
          "ElevenLabs API key is not configured. Please check your .env file and restart the dev server."
        );
        setConversationMode("listening");
        return;
      }

      console.log("API Key loaded:", apiKey ? "✓" : "✗");

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
      console.error("Text-to-speech error:", error);
      alert("Failed to generate speech");
      setConversationMode("listening");
    }
  };

  const formatTime = (seconds) => {
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

      // Start MediaRecorder for audio capture
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error("Error accessing microphone:", error);
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

      // Stop MediaRecorder and release mic when call ends
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      console.log("Stopping recording...");
      recognitionStartedRef.current = false;
      recognition.stop();

      // Must use stop() to flush audio data – pause() never fires ondataavailable
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

        // Start new MediaRecorder for next recording
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

      console.log("Transcript:", transcript);
      console.log("Audio chunks:", chunks.length);

      // Process the transcript when recording stops
      if (transcript.trim()) {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioBase64 = await convertBlobToBase64(audioBlob);
        const hasValidAudio = typeof audioBase64 === "string" && audioBase64.length > 100;

        console.log("Audio base64 length:", audioBase64?.length ?? 0);

        const userMessage = {
          id: messages.length + 1,
          type: "user",
          text: transcript.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        setConversationMode("thinking");

        // Hume AI emotion detection – only when we have valid audio
        if (hasValidAudio) {
          axiosInstance.post("/emotion-from-voice", { audioBase64 }, { timeout: 90000 })
            .then((res) => {
              const d = res.data;
              if (d?.emotion) {
                setDetectedEmotion({ emotion: d.emotion, score: d.score ?? 0, source: d?.source || "Hume AI" });
              } else if (d?.error) {
                setDetectedEmotion({ emotion: null, score: 0, source: "Hume AI", error: d.error });
              }
            })
            .catch((e) => {
              const msg = e.response?.data?.error ?? e.response?.data?.message ?? (e.code === "ECONNABORTED" ? "Request timed out" : "Unavailable");
              setDetectedEmotion({ emotion: null, score: 0, source: "Hume AI", error: msg });
            });
        }

        // Fetch bot response – include audioBase64 only when valid so backend can run Hume emotion detection
        const botResult = await fetchBotResponse(userMessage, hasValidAudio ? audioBase64 : null);
        const botResponse = botResult?.response ?? botResult;
        const messageId = botResult?.messageId ?? botResult?.message_id;

        if (botResponse) {
          // Add bot message to messages array
          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: botResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

          // Backup emotion-from-voice with messageId for storage (only when we have valid audio)
          if (messageId && hasValidAudio && audioBase64) {
            axiosInstance.post("/emotion-from-voice", { audioBase64, messageId }).catch(() => { });
          }

          // Switch to speaking mode and play TTS
          setConversationMode("speaking");
          await speakText(botResponse);
        } else {
          setConversationMode("listening");
        }

        // Clear transcript and audio chunks for next input
        setTranscript("");
        audioChunksRef.current = [];
      }
    } else {
      console.log("Starting recording...");
      setSpeechError(null);
      // Restart Web Speech API and MediaRecorder (guard against already started)
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

  const handleVoiceSelect = (index) => {
    setSelectedVoiceIndex(index);
  };

  const handleCarouselScroll = (direction) => {
    const newIndex =
      direction === "left"
        ? Math.max(0, selectedVoiceIndex - 1)
        : Math.min(VOICES.length - 1, selectedVoiceIndex + 1);
    setSelectedVoiceIndex(newIndex);
  };

  return (
    <div className="voice-ai-container flex flex-col items-center">
      <div className="page-header w-full">
        <h1 className="page-title">
          Voice <span className="gradient-text">Selection</span>
        </h1>
        <p className="page-subtitle">Personalize your AI assistant's voice and personality</p>
      </div>

      <div className="w-full flex flex-col items-center gap-12">
        <div className="w-full">
          {!isCallActive ? (
            <div className="design-section w-full relative overflow-hidden p-8 sm:p-12">
              <div className="relative w-full flex items-center justify-center">
                {/* Left Arrow */}
                <button
                  onClick={() => handleCarouselScroll("left")}
                  disabled={selectedVoiceIndex === 0}
                  className={`absolute left-0 z-20 w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center transition-all ${selectedVoiceIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-110 hover:shadow-lg text-indigo-600"
                    }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                {/* Carousel Container */}
                <div className="relative w-full h-80 flex items-center justify-center overflow-hidden">
                  <div
                    ref={carouselRef}
                    className="absolute flex items-center gap-12 transition-transform duration-500 ease-out"
                    style={{
                      transform: `translateX(calc(50% - ${selectedVoiceIndex * 240 + 100}px))`,
                    }}
                  >
                    {VOICES.map((voice, index) => {
                      const isActive = index === selectedVoiceIndex;
                      return (
                        <div
                          key={voice.id}
                          onClick={() => handleVoiceSelect(index)}
                          className={`relative flex-shrink-0 w-48 h-64 rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4 ${isActive
                            ? "scale-110 shadow-2xl ring-4 ring-indigo-50"
                            : "scale-90 opacity-40 blur-[1px] hover:opacity-60"
                            }`}
                          style={{
                            background: isActive
                              ? `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
                              : '#f8fafc',
                            border: isActive ? 'none' : '2px border-gray-100'
                          }}
                        >
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {voice.avatar}
                          </div>
                          <div className="text-center">
                            <p className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                              {voice.gender}
                            </p>
                            <p className={`text-lg font-bold mt-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                              Voice {index + 1}
                            </p>
                          </div>
                          {isActive && (
                            <div className="absolute top-4 right-4 animate-pulse">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
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
                  className={`absolute right-0 z-20 w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center transition-all ${selectedVoiceIndex === VOICES.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:scale-110 hover:shadow-lg text-indigo-600"
                    }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="design-section w-full max-w-2xl py-12 px-8 flex flex-col items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-50">
                <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
              </div>

              <div className={`w-40 h-40 rounded-full flex items-center justify-center text-6xl shadow-2xl relative transition-all duration-700 ${conversationMode === 'speaking' ? 'scale-110' : 'scale-100'
                }`}
                style={{ background: 'var(--primary-gradient)', color: 'white' }}>
                {VOICES[selectedVoiceIndex].avatar}
                {conversationMode === 'speaking' && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                )}
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice AI Active</h2>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-sm font-bold text-gray-500 tracking-widest uppercase">
                    {formatDuration(callDuration)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-50 rounded-2xl p-6 min-h-[100px] flex flex-col items-center justify-center text-center border border-gray-100">
                <p className={`text-lg font-medium leading-relaxed ${transcript ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                  {transcript || (conversationMode === 'thinking' ? 'Processing...' : 'Awaiting speech...')}
                </p>
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${conversationMode === 'thinking' ? 'bg-indigo-400 animate-bounce' : 'bg-gray-200'}`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center">
          {isCallActive && (
            <div className="flex gap-4 p-2 bg-white rounded-3xl shadow-xl border border-gray-50">
              <button
                onClick={handleMuteToggle}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMuted ? "bg-rose-50 text-rose-600" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {isMuted ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    </>
                  )}
                </svg>
              </button>

              <button
                onClick={handleRecordingToggle}
                disabled={conversationMode === "thinking" || conversationMode === "speaking"}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isRecording ? "bg-rose-500 text-white animate-pulse" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-gray-400'}`}></div>
              </button>
            </div>
          )}

          <button
            onClick={handleCallToggle}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl hover:scale-105 active:scale-95 ${isCallActive
              ? "bg-rose-500 text-white shadow-rose-200"
              : "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-indigo-100"
              }`}
          >
            {isCallActive ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"></path>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      {isTesting && isCallActive && (
        <div className="design-section w-full max-w-2xl p-6 mt-8">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">
            Speech-to-Text Debug Output
          </p>
          <textarea
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={transcript}
            readOnly
            placeholder="Real-time transcription will appear here..."
            rows="4"
          />
        </div>
      )}

      {!isCallActive && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-12">
          {[
            { icon: '🎙️', title: 'Voice Chat', desc: 'Natural voice conversation' },
            { icon: '💡', title: 'Support', desc: 'Real-time support & guidance' },
            { icon: '🛡️', title: 'Private', desc: 'Private & secure interaction' }
          ].map((feature, i) => (
            <div key={i} className="design-section p-6 flex flex-col items-center gap-4 text-center hover:-translate-y-1 transition-transform">
              <div className="text-3xl">{feature.icon}</div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-800">{feature.title}</span>
                <span className="text-xs text-gray-500 leading-tight">{feature.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceAI;
