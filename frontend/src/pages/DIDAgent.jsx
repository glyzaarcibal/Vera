import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Globe } from 'lucide-react';
import womanAmericaVideo from '../assets/Unleash+yo.mp4';
import manAmericaVideo from '../assets/_Removed+D.mp4';
import womanFilipinoVideo from '../assets/pinoywomen.mp4';
import manFilipinoVideo from '../assets/pinoyman.mp4';
import axiosInstance from '../utils/axios.instance';

/**
 * DIDAgent — AI-powered human avatar with speech recognition and synthesis
 * - Uses ElevenLabs for speech-to-text and text-to-speech
 * - Uses Groq for AI responses
 * - Animated talking avatar video
 * - Multi-language support (Filipino & English)
 * - Choose avatar: American Woman/Man, Filipino Woman/Man
 * - Saves session data to backend
 */
export default function DIDAgent({ onTranscript }) {
  const [avatarType, setAvatarType] = useState(null); // 'woman-america', 'man-america', 'woman-filipino', 'man-filipino'
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('fil'); // Filipino
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  // API Keys
  const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  // Voice IDs for different avatars
  const VOICE_IDS = {
    'woman-america': '21m00Tcm4TlvDq8ikWAM', // Rachel - natural female voice
    'man-america': 'pNInz6obpgDQGcFmaJgB', // Adam - natural male voice
    'woman-filipino': '21m00Tcm4TlvDq8ikWAM', // Rachel (can be customized)
    'man-filipino': 'pNInz6obpgDQGcFmaJgB' // Adam (can be customized)
  };

  // Video mapping
  const VIDEO_MAP = {
    'woman-america': womanAmericaVideo,
    'man-america': manAmericaVideo,
    'woman-filipino': womanFilipinoVideo,
    'man-filipino': manFilipinoVideo
  };

  // Avatar labels
  const AVATAR_LABELS = {
    'woman-america': '👩 American Woman',
    'man-america': '👨 American Man',
    'woman-filipino': '👩 Filipino Woman',
    'man-filipino': '👨 Filipino Man'
  };

  // Languages
  const languages = [
    { code: 'fil', name: '🇵🇭 Filipino' },
    { code: 'eng', name: '🇺🇸 English' },
  ];

  // AI Personality
  const AI_PERSONALITY = 'You are a friendly, helpful AI assistant. Respond in a natural, conversational way with warmth and professionalism. Keep responses concise (2-3 sentences max).';

  // Initialize session when avatar is selected
  const initializeSession = async (selectedAvatarType) => {
    try {
      const avatarData = {
        type: selectedAvatarType,
        label: AVATAR_LABELS[selectedAvatarType],
        language: language
      };

      const res = await axiosInstance.post(
        `/sessions/start-session/Avatar`,
        { avatar: avatarData }
      );
      const { session } = res.data;
      setSessionId(session.id);
      console.log('Session initialized:', session.id);
      return session;
    } catch (e) {
      console.error('Session initialization error:', e);
      alert(e.response?.data?.message || 'Failed to start session');
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = async (type) => {
    setAvatarType(type);
    await initializeSession(type);
  };

  // Convert blob to base64
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

  // Save message to backend
  const saveMessageToBackend = async (message, audioBase64 = null) => {
    if (!sessionId) return;

    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${sessionId}`,
        { message, messages, audioBase64 }
      );
      return res.data.response;
    } catch (e) {
      console.error('Message save error:', e);
      throw e;
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 10000) {
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied');
      setIsListening(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  // Transcribe audio using ElevenLabs
  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model_id', 'scribe_v2');
      formData.append('language_code', language);

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.text && data.text.trim()) {
        const transcribedText = data.text.trim();
        console.log('Transcribed:', transcribedText);

        // Convert audio to base64 for backend storage
        const audioBase64 = await convertBlobToBase64(audioBlob);

        // Create user message
        const userMessage = {
          id: messages.length + 1,
          type: 'user',
          text: transcribedText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Call onTranscript callback if provided
        onTranscript?.(transcribedText, {
          author: 'User',
          source: 'did',
          language: language
        });

        // Get AI response and save to backend
        await getAIResponse(transcribedText, audioBase64);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(`Transcription error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get AI response from Groq and save to backend
  const getAIResponse = async (userMessage, audioBase64 = null) => {
    setIsProcessing(true);

    try {
      // Get response from Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: AI_PERSONALITY
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();

      if (aiResponse) {
        console.log('AI Response:', aiResponse);

        // Create bot message
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: aiResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Save to backend
        if (sessionId) {
          try {
            await saveMessageToBackend(
              { text: userMessage },
              audioBase64
            );
          } catch (e) {
            console.error('Failed to save message:', e);
          }
        }

        // Text-to-speech
        await speakText(aiResponse);
      }
    } catch (err) {
      console.error('AI response error:', err);
      setError(`AI error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-speech using ElevenLabs
  const speakText = async (text) => {
    setIsSpeaking(true);

    try {
      const voiceId = VOICE_IDS[avatarType];

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();

        // Play video while speaking
        if (videoRef.current) {
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.error('TTS error:', err);
      setError(`Speech error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
      setIsSpeaking(false);
    }
  };

  // Handle audio end
  const handleAudioEnd = () => {
    setIsSpeaking(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Send text input
  const sendText = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    await getAIResponse(userMessage.text);
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    console.log('Language changed to:', newLanguage);
  };

  const currentLang = languages.find((lang) => lang.code === language);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden">
      {/* Avatar Selection Screen */}
      {!avatarType && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
          <div className="text-center max-w-4xl w-full space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Choose Your Avatar Agent
              </h1>
              <p className="text-lg text-gray-300">
                Select an avatar to begin your AI-powered conversation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* American Woman */}
              <button
                onClick={() => handleAvatarSelect('woman-america')}
                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-pink-400"
              >
                <div className="text-center space-y-2">
                  <div className="text-5xl">👩</div>
                  <h2 className="text-base font-bold text-white">American Woman</h2>
                  <p className="text-gray-300 text-xs">Professional female voice</p>
                  <div className="px-4 py-2 bg-pink-500 rounded-full text-white text-xs font-semibold group-hover:bg-pink-600 transition-colors">
                    Choose
                  </div>
                </div>
              </button>

              {/* American Man */}
              <button
                onClick={() => handleAvatarSelect('man-america')}
                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-400"
              >
                <div className="text-center space-y-2">
                  <div className="text-5xl">👨</div>
                  <h2 className="text-base font-bold text-white">American Man</h2>
                  <p className="text-gray-300 text-xs">Professional male voice</p>
                  <div className="px-4 py-2 bg-blue-500 rounded-full text-white text-xs font-semibold group-hover:bg-blue-600 transition-colors">
                    Choose
                  </div>
                </div>
              </button>

              {/* Filipino Woman */}
              <button
                onClick={() => handleAvatarSelect('woman-filipino')}
                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-purple-400"
              >
                <div className="text-center space-y-2">
                  <div className="text-5xl">👩</div>
                  <h2 className="text-base font-bold text-white">Filipino Woman</h2>
                  <p className="text-gray-300 text-xs">Warm female voice</p>
                  <div className="px-4 py-2 bg-purple-500 rounded-full text-white text-xs font-semibold group-hover:bg-purple-600 transition-colors">
                    Choose
                  </div>
                </div>
              </button>

              {/* Filipino Man */}
              <button
                onClick={() => handleAvatarSelect('man-filipino')}
                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-green-400"
              >
                <div className="text-center space-y-2">
                  <div className="text-5xl">👨</div>
                  <h2 className="text-base font-bold text-white">Filipino Man</h2>
                  <p className="text-gray-300 text-xs">Friendly male voice</p>
                  <div className="px-4 py-2 bg-green-500 rounded-full text-white text-xs font-semibold group-hover:bg-green-600 transition-colors">
                    Choose
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video - Full Screen */}
      {avatarType && (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={VIDEO_MAP[avatarType]}
            className="w-full h-full object-contain"
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => console.log('Video loaded successfully')}
            onError={(e) => console.error('Video load error:', e)}
          />

          {/* Avatar Badge */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-white font-semibold">{AVATAR_LABELS[avatarType]}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded text-white">
              {currentLang?.name}
            </span>
            <button
              onClick={() => {
                setAvatarType(null);
                setSessionId(null);
                setMessages([]);
              }}
              className="ml-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white transition-colors"
            >
              Change
            </button>
          </div>

          {/* Speaking indicator overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 border-8 border-green-400 animate-pulse pointer-events-none"></div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-full text-white text-sm font-semibold">
              🤔 Thinking...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 px-6 py-3 rounded-lg text-white text-sm font-semibold max-w-md">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Floating Controls at Bottom */}
      {avatarType && (
        <div className="absolute bottom-0 left-0 right-0 w-full">
          <div className="bg-black/80 backdrop-blur-md p-4 space-y-3">
            {/* Language Selector */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Globe size={16} className="text-gray-400" />
              <span className="text-xs text-gray-400">Language:</span>
              <div className="flex gap-2 flex-wrap">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isProcessing || isSpeaking}
                    className={`px-3 py-1 text-xs rounded transition-all ${language === lang.code
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Control */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleListening}
                disabled={isProcessing || isSpeaking}
                className={`p-4 rounded-full transition-all ${isListening
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? (
                  <Mic size={28} className="text-white" />
                ) : (
                  <MicOff size={28} className="text-white" />
                )}
              </button>

              <div className="text-white">
                <div className="font-semibold">
                  {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : isProcessing ? '⏳ Processing...' : '💬 Ready to chat'}
                </div>
                <div className="text-xs text-gray-300">
                  {isListening ? `Speak now in ${currentLang?.name}` : 'Click mic or type below'}
                </div>
              </div>
            </div>

            {/* Text Input */}
            <div className="flex gap-2 max-w-4xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Type your message..."
                onKeyDown={(e) => { if (e.key === 'Enter') sendText(); }}
                disabled={isProcessing || isSpeaking}
              />
              <button
                onClick={sendText}
                disabled={isProcessing || isSpeaking || !input.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Send
              </button>
            </div>

            {/* Footer */}
            <div className="text-xs text-gray-400 text-center">
              💡 Powered by ElevenLabs Scribe v2 - Multilingual Speech Recognition
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio player for TTS */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        className="hidden"
      />
    </div>
  );
}