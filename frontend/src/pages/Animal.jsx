import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import './Welcome.css';
import meowVideo from '../assets/meow+meow+.mp4';
import arfarfVideo from '../assets/++arf+arf+.mp4';
import axiosInstance from '../utils/axios.instance';

/**
 * AnimalAI — AI-powered avatar with speech recognition and synthesis
 * - Uses ElevenLabs for speech-to-text and text-to-speech
 * - Uses Groq for AI responses
 * - Animated talking avatar video
 * - Choose between Cat and Dog avatars
 * - Saves session data to backend
 */
export default function AnimalAI({ onTranscript }) {
    const [animalType, setAnimalType] = useState(null); // 'cat' or 'dog'
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [detectedEmotion, setDetectedEmotion] = useState(null);

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
        cat: '21m00Tcm4TlvDq8ikWAM', // Cat voice (high-pitched)
        dog: 'JBFqnCBsd6RMkjVDRZzb' // Dog voice (deeper, friendlier)
    };

    // Avatar personalities
    const AVATAR_PERSONALITIES = {
        cat: 'You are a playful, slightly sassy cat AI assistant. Respond with feline charm, occasional "meows," and cat-like independence. Keep responses concise (2-3 sentences max).',
        dog: 'You are an enthusiastic, loyal dog AI assistant. Respond with boundless energy, tail-wagging excitement, and occasional "woofs!" Keep responses concise (2-3 sentences max).'
    };

    // Video mapping
    const VIDEO_MAP = {
        cat: meowVideo,
        dog: arfarfVideo
    };

    // Initialize session when animal is selected
    const initializeSession = async (selectedAnimalType) => {
        try {
            const avatarData = {
                type: selectedAnimalType,
                label: `${selectedAnimalType.charAt(0).toUpperCase() + selectedAnimalType.slice(1)} AI`,
                language: 'eng'
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
            // Fallback if backend is not ready
        }
    };

    // Handle animal selection
    const handleAnimalSelect = async (type) => {
        setAnimalType(type);
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

    // Save message to backend (returns { response, messageId } for emotion backup)
    const saveMessageToBackend = async (message, audioBase64 = null) => {
        if (!sessionId) return null;

        try {
            const res = await axiosInstance.post(
                `/messages/process-message/${sessionId}`,
                { message, messages, audioBase64 }
            );
            return res.data;
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
            formData.append('language_code', 'eng');

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

                // Hume AI emotion detection (non-blocking) – for UI display (90s timeout: Hume batch can take 30–60s)
                axiosInstance.post('/emotion-from-voice', { audioBase64 }, { timeout: 90000 })
                    .then((res) => {
                        const d = res.data;
                        if (d?.emotion) {
                            setDetectedEmotion({ emotion: d.emotion, score: d.score ?? 0, source: d?.source || 'Hume AI' });
                        } else if (d?.error) {
                            setDetectedEmotion({ emotion: null, score: 0, source: 'Hume AI', error: d.error });
                        }
                    })
                    .catch((e) => {
                        const msg = e.response?.data?.error ?? e.response?.data?.message ?? (e.code === 'ECONNABORTED' ? 'Request timed out' : 'Unavailable');
                        setDetectedEmotion({ emotion: null, score: 0, source: 'Hume AI', error: msg });
                    });

                const authorName = 'User';
                onTranscript?.(transcribedText, { author: authorName, source: 'animal' });

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

    // Get AI response from Groq
    const getAIResponse = async (userMessage, audioBase64 = null) => {
        if (!GROQ_API_KEY) {
            console.error('Groq API Key is missing. Check your .env file.');
            setError('System configuration error: API key missing');
            return;
        }
        setIsProcessing(true);

        try {
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
                            content: AVATAR_PERSONALITIES[animalType]
                        },
                        ...messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text })),
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

                // Update local messages state
                setMessages(prev => [
                    ...prev,
                    { type: 'user', text: userMessage },
                    { type: 'bot', text: aiResponse }
                ]);

                const authorName = `${animalType.charAt(0).toUpperCase() + animalType.slice(1)} AI`;
                onTranscript?.(aiResponse, { author: authorName, source: 'animal' });

                // Save to backend (includes emotion via process-message)
                if (sessionId) {
                    try {
                        const saveResult = await saveMessageToBackend({ text: userMessage }, audioBase64);
                        const messageId = saveResult?.messageId ?? saveResult?.message_id;
                        if (messageId && audioBase64) {
                            axiosInstance.post('/emotion-from-voice', { audioBase64, messageId })
                                .catch(() => { });
                        }
                    } catch (e) {
                        console.error('Failed to save message:', e);
                    }
                }

                // Convert AI response to speech
                await speakText(aiResponse);
            }
        } catch (err) {
            console.error('Groq API error:', err);
            setError(`AI response error: ${err.message}`);
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    // Convert text to speech using ElevenLabs
    const speakText = async (text) => {
        setIsSpeaking(true);

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[animalType]}?output_format=mp3_44100_128`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Text-to-speech failed: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play();

                // Play talking video while speaking
                if (videoRef.current) {
                    videoRef.current.play();
                }
            }
        } catch (err) {
            console.error('Text-to-speech error:', err);
            setError(`Speech error: ${err.message}`);
            setTimeout(() => setError(null), 5000);
            setIsSpeaking(false);
        }
    };

    // Handle text input send
    const sendText = async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        onTranscript?.(trimmed, { author: 'User', source: 'animal' });
        setInput('');

        await getAIResponse(trimmed);
    };

    // Toggle voice recording
    const toggleListening = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Handle audio end
    const handleAudioEnd = () => {
        setIsSpeaking(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };
    return (
        <div className="page-container flex flex-col items-center">
            {!animalType ? (
                <>
                    <div className="page-header w-full">
                        <h1 className="page-title">
                            Companion <span className="gradient-text">Selection</span>
                        </h1>
                        <p className="page-subtitle">Select a friendly animal avatar to start your conversation</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl pb-12">
                        {[
                            { id: 'cat', name: 'Cat AI', icon: '🐱', desc: 'Sassy and playful feline friend' },
                            { id: 'dog', name: 'Dog AI', icon: '🐶', desc: 'Loyal and energetic canine companion' }
                        ].map(animal => (
                            <button
                                key={animal.id}
                                onClick={() => handleAnimalSelect(animal.id)}
                                className="design-section glass-card text-left p-10 group flex flex-col items-center text-center transition-all duration-500"
                            >
                                <div className="text-7xl mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 drop-shadow-xl">
                                    {animal.icon}
                                </div>
                                <h3 className="section-title text-2xl mb-2 capitalize">{animal.name}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px] mb-8">
                                    {animal.desc}
                                </p>
                                <div className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
                                    Start Session
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
                    <div className="design-section w-full p-0 overflow-hidden relative shadow-2xl border-4 border-white aspect-video bg-gray-900 rounded-3xl flex items-center justify-center">
                        <video
                            ref={videoRef}
                            src={VIDEO_MAP[animalType]}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            loop
                        />

                        <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold">
                                {animalType === 'cat' ? '🐱' : '🐶'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{animalType} AI</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-green-600 uppercase">Live</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setAnimalType(null);
                                    setMessages([]);
                                    setSessionId(null);
                                }}
                                className="ml-4 transition-all hover:rotate-90"
                                title="Switch Avatar"
                            >
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>

                        {isSpeaking && (
                            <div className="absolute inset-0 border-4 border-[#667eea] animate-pulse pointer-events-none rounded-2xl"></div>
                        )}

                        {isProcessing && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg px-6 py-3 rounded-full text-gray-800 text-sm font-semibold border border-gray-100">
                                Thinking...
                            </div>
                        )}

                        {detectedEmotion && (
                            <div className="absolute bottom-24 left-6 right-6 md:left-auto md:right-6 md:max-w-xs bg-white/95 backdrop-blur-md shadow-xl px-5 py-3 rounded-2xl border border-white/50 text-left animate-in slide-in-from-right-10">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="bg-indigo-50 p-1 rounded-md">
                                        <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Emotion Detected</span>
                                </div>
                                <span className="text-indigo-600 font-bold text-lg leading-none block">
                                    {detectedEmotion.emotion ? (
                                        <>{detectedEmotion.emotion} <span className="text-[10px] text-gray-400 ml-1">{detectedEmotion.score > 0 && ` ${Math.round(detectedEmotion.score * 100)}%`}</span></>
                                    ) : (
                                        <span className="text-amber-600 text-sm">Analyzing...</span>
                                    )}
                                </span>
                                <div className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Powered by Hume AI Prosody</div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 px-6 py-3 rounded-lg text-red-700 text-sm font-semibold max-w-md">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-2xl">
                        <div className="glass-card w-full border border-white/50 shadow-2xl rounded-[32px] p-6 flex items-center gap-6 transition-all hover:shadow-indigo-100/50">
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={isProcessing || isSpeaking}
                                className={`p-6 rounded-[24px] transition-all duration-500 transform active:scale-95 shadow-xl ${isListening
                                    ? 'bg-rose-500 shadow-rose-200 animate-pulse'
                                    : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] shadow-indigo-200 hover:shadow-indigo-300'
                                    } disabled:opacity-50 disabled:grayscale text-white`}
                                title={isListening ? 'Stop listening' : 'Start listening'}
                            >
                                {isListening ? (
                                    <Mic size={28} className="text-white" />
                                ) : (
                                    <MicOff size={28} className="text-white" />
                                )}
                            </button>

                            <div className="flex-1 flex flex-col">
                                <div className="text-slate-800 font-extrabold text-lg tracking-tight">
                                    {isListening ? 'Listening to you...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Tap Mic to Chat'}
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1.5">
                                    {isListening ? 'Companion is attentive' : isSpeaking ? 'Interactive guidance' : 'Companion at your service'}
                                </div>
                            </div>

                            {/* Speech Activity Indicator */}
                            {isListening && (
                                <div className="flex items-end gap-1 h-8 px-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-rose-400 rounded-full animate-bounce"
                                            style={{
                                                height: `${30 + Math.random() * 70}%`,
                                                animationDuration: `${0.4 + Math.random() * 0.6}s`,
                                                animationDelay: `${i * 0.05}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hidden audio player for TTS */}
                    <audio
                        ref={audioRef}
                        onEnded={handleAudioEnd}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
};
