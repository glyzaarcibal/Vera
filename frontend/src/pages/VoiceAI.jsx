import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axios.instance";

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
  const audioPlayerRef = useRef(null);
  const carouselRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
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
      alert(e.response.data.message || "Internal Server Error");
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
      const { response } = res.data;
      return response;
    } catch (e) {
      alert("Internal Server Error");
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
      if (recognition) {
        recognition.start();
        setIsRecording(true);
      }

      // Start MediaRecorder for audio capture
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        recognition.stop();
        setIsRecording(false);
      }

      // Stop MediaRecorder when call ends
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        audioChunksRef.current = [];
      }
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      console.log("Stopping recording...");
      // Stop both Web Speech API and MediaRecorder temporarily
      recognition.stop();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.pause();
      }

      setIsRecording(false);
      setIsListening(false);

      console.log("Transcript:", transcript);
      console.log("Audio chunks:", audioChunksRef.current.length);

      // Process the transcript when recording stops
      if (transcript.trim()) {
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Convert audio blob to base64
        const audioBase64 = await convertBlobToBase64(audioBlob);
        console.log("Audio base64 length:", audioBase64.length);

        // Add user message to messages array
        const userMessage = {
          id: messages.length + 1,
          type: "user",
          text: transcript.trim(),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Switch to thinking mode
        setConversationMode("thinking");

        // Fetch bot response with audio base64
        const botResponse = await fetchBotResponse(userMessage, audioBase64);

        if (botResponse) {
          // Add bot message to messages array
          const botMessage = {
            id: messages.length + 2,
            type: "bot",
            text: botResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

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
      // Restart Web Speech API and MediaRecorder
      recognition.start();

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
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-10 px-6 bg-gray-50 from-gray-50 to-gray-100">
      <div className="max-w-4xl w-full flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-6 w-full">
          {!isCallActive ? (
            <div className="relative w-full flex items-center justify-center py-8">
              {/* Left Arrow */}
              <button
                onClick={() => handleCarouselScroll("left")}
                disabled={selectedVoiceIndex === 0}
                className={`absolute left-4 md:left-8 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
                  selectedVoiceIndex === 0
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:scale-110 cursor-pointer"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* Carousel Container */}
              <div className="relative w-full max-w-full h-60 flex items-center justify-center overflow-hidden">
                <div
                  ref={carouselRef}
                  className="absolute flex items-center gap-8 transition-transform duration-300 ease-out w-full"
                  style={{
                    transform: `translateX(calc(53% - ${
                      selectedVoiceIndex * 160 + 125
                    }px))`,
                  }}
                >
                  {VOICES.map((voice, index) => {
                    const isActive = index === selectedVoiceIndex;
                    const distance = Math.abs(index - selectedVoiceIndex);
                    const isAdjacent = distance === 1;

                    return (
                      <div
                        key={voice.id}
                        onClick={() => handleVoiceSelect(index)}
                        className="relative flex-shrink-0 transition-all duration-300 cursor-pointer"
                        style={{
                          transform: `scale(${
                            isActive ? 1 : isAdjacent ? 0.75 : 0.6
                          })`,
                          opacity: isActive ? 1 : isAdjacent ? 0.6 : 0.3,
                          pointerEvents: distance > 1 ? "none" : "auto",
                        }}
                      >
                        <div
                          className={`${
                            isActive ? "w-44 h-44 md:w-52 md:h-52" : "w-32 h-32"
                          } relative flex items-center justify-center transition-all duration-300`}
                        >
                          <div
                            className={`w-full h-full rounded-full bg-gradient-to-br ${
                              voice.gradient
                            } flex items-center justify-center text-white ${
                              isActive ? "text-7xl md:text-8xl" : "text-5xl"
                            } font-semibold shadow-xl relative z-10`}
                          >
                            {voice.avatar}
                          </div>
                        </div>
                        {isActive && (
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <p className="text-xs font-semibold text-gray-600">
                              {voice.gender}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Fade Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => handleCarouselScroll("right")}
                disabled={selectedVoiceIndex === VOICES.length - 1}
                className={`absolute right-4 md:right-8 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
                  selectedVoiceIndex === VOICES.length - 1
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:scale-110 cursor-pointer"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          ) : (
            <div className="relative p-5">
              <div className="w-44 h-44 md:w-52 md:h-52 relative flex items-center justify-center">
                <div
                  className={`w-44 h-44 md:w-52 md:h-52 rounded-full bg-gradient-to-br ${
                    VOICES[selectedVoiceIndex].gradient
                  } flex items-center justify-center text-white text-7xl md:text-8xl font-semibold shadow-xl shadow-indigo-300 relative z-10 ${
                    isListening ? "animate-pulse" : ""
                  }`}
                >
                  {VOICES[selectedVoiceIndex].avatar}
                </div>
                {isListening && (
                  <>
                    <div className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border-2 border-indigo-500 opacity-0 animate-[ping_2s_ease-out_infinite]"></div>
                    <div className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border-2 border-indigo-500 opacity-0 animate-[ping_2s_ease-out_infinite_0.5s]"></div>
                    <div className="absolute w-44 h-44 md:w-52 md:h-52 rounded-full border-2 border-indigo-500 opacity-0 animate-[ping_2s_ease-out_infinite_1s]"></div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Vera Voice Assistant
            </h2>
            <p className="text-base text-gray-500">
              {isCallActive ? (
                <span className="flex items-center gap-2 justify-center text-green-500 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {formatTime(callDuration)}
                </span>
              ) : (
                <span className="text-gray-400">Ready to listen</span>
              )}
            </p>
          </div>

          {isCallActive && (
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-sm mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {conversationMode === "listening"
                  ? "Live Transcript"
                  : conversationMode === "thinking"
                  ? "Processing"
                  : "Speaking"}
              </p>
              <div className="min-h-[60px] text-base leading-relaxed text-gray-900">
                {conversationMode === "listening" && isListening && !isMuted ? (
                  <p className="text-green-500 italic m-0">Listening...</p>
                ) : conversationMode === "thinking" ? (
                  <p className="text-blue-500 italic m-0">Thinking...</p>
                ) : conversationMode === "speaking" ? (
                  <p className="text-purple-500 italic m-0">Speaking...</p>
                ) : isMuted ? (
                  <p className="text-red-500 italic m-0">Microphone muted</p>
                ) : (
                  <p className="text-gray-400 italic m-0">
                    Waiting for input...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-6 items-center">
          {isCallActive && (
            <>
              <button
                className={`w-14 h-14 rounded-full border-none cursor-pointer flex items-center justify-center transition-all shadow-lg hover:scale-105 hover:shadow-xl ${
                  isMuted ? "bg-red-500 text-white" : "bg-white text-gray-600"
                }`}
                onClick={handleMuteToggle}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {isMuted ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </>
                  )}
                </svg>
              </button>

              <button
                className={`w-14 h-14 rounded-full border-none flex items-center justify-center transition-all shadow-lg ${
                  conversationMode === "thinking" ||
                  conversationMode === "speaking"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isRecording
                    ? "bg-red-500 text-white cursor-pointer hover:scale-105 hover:shadow-xl"
                    : "bg-white text-gray-600 cursor-pointer hover:scale-105 hover:shadow-xl"
                }`}
                onClick={handleRecordingToggle}
                disabled={
                  conversationMode === "thinking" ||
                  conversationMode === "speaking"
                }
                title={
                  conversationMode === "thinking" ||
                  conversationMode === "speaking"
                    ? "Disabled during processing"
                    : isRecording
                    ? "Stop Recording"
                    : "Start Recording"
                }
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={isRecording ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </button>
            </>
          )}

          <button
            className={`w-18 h-18 rounded-full border-none cursor-pointer flex items-center justify-center transition-all shadow-xl hover:scale-105 ${
              isCallActive
                ? "bg-red-500 text-white hover:shadow-red-500/40"
                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/40"
            }`}
            onClick={handleCallToggle}
          >
            {isCallActive ? (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"></path>
              </svg>
            ) : (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"></path>
              </svg>
            )}
          </button>
        </div>

        {isTesting && isCallActive && (
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Speech-to-Text Output
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={transcript}
              readOnly
              placeholder="Your speech will appear here..."
              rows="6"
            />
          </div>
        )}

        {!isCallActive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-500"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              </svg>
              <p className="text-sm text-gray-600 leading-snug m-0">
                Natural voice conversation
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-500"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p className="text-sm text-gray-600 leading-snug m-0">
                Real-time support & guidance
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl flex flex-col items-center gap-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-500"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <p className="text-sm text-gray-600 leading-snug m-0">
                Private & secure
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAI;
