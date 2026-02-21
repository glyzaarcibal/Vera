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
                                .catch(() => {});
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
        <div className="relative w-full h-full min-h-0 flex flex-col flex-1 bg-[#fafbfc]">
            {/* Avatar Selection Screen - compact like DIDAgent */}
            {!animalType && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 overflow-auto min-h-0">
                    <div className="text-center max-w-2xl w-full space-y-3 sm:space-y-4 flex-shrink-0">
                        <div className="hero-badge text-xs py-1.5 px-3">Animal AI</div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">
                            Choose Your <span className="gradient-text">Companion</span>
                        </h1>
                        <p className="text-sm text-gray-600 mb-1">
                            Select an avatar to chat with
                        </p>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto">
                            <button
                                type="button"
                                onClick={() => handleAnimalSelect('cat')}
                                className="bg-white rounded-xl border-2 border-transparent hover:border-[#667eea] transition-all hover:shadow-md text-center cursor-pointer py-3 px-3"
                            >
                                <div className="text-4xl sm:text-5xl mb-2">🐱</div>
                                <h3 className="text-sm font-semibold text-[#1a1a1a]">Cat</h3>
                                <p className="text-xs text-gray-600 mt-0.5">Playful and sassy feline friend</p>
                                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 transition-opacity">
                                    Choose Cat
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAnimalSelect('dog')}
                                className="bg-white rounded-xl border-2 border-transparent hover:border-[#667eea] transition-all hover:shadow-md text-center cursor-pointer py-3 px-3"
                            >
                                <div className="text-4xl sm:text-5xl mb-2">🐶</div>
                                <h3 className="text-sm font-semibold text-[#1a1a1a]">Dog</h3>
                                <p className="text-xs text-gray-600 mt-0.5">Enthusiastic and loyal canine companion</p>
                                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 transition-opacity">
                                    Choose Dog
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video - Full Screen */}
            {animalType && (
                <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 w-full">
                    <video
                        ref={videoRef}
                        src={VIDEO_MAP[animalType]}
                        className="w-full h-full min-h-0 object-contain"
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onLoadedData={() => console.log('Video loaded successfully')}
                        onError={(e) => console.error('Video load error:', e)}
                    />

                    {/* Avatar Type Badge - light theme like Welcome */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md shadow-md px-4 py-2 rounded-full flex items-center gap-2 border border-gray-100">
                        <span className="text-2xl">{animalType === 'cat' ? '🐱' : '🐶'}</span>
                        <span className="text-gray-900 font-semibold capitalize">{`${animalType} AI`}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setAnimalType(null);
                                setSessionId(null);
                                setMessages([]);
                            }}
                            className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors font-medium"
                        >
                            Change
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
                        <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-xs bg-white/95 backdrop-blur-md shadow-md px-4 py-2 rounded-xl border border-gray-100 text-left">
                            <span className="text-[#667eea] font-semibold text-xs">
                                {detectedEmotion.source}:{' '}
                                {detectedEmotion.emotion ? (
                                    <>{detectedEmotion.emotion}{detectedEmotion.score > 0 && ` (${Math.round(detectedEmotion.score * 100)}%)`}</>
                                ) : (
                                    <span className="text-amber-600">{detectedEmotion.error || 'No emotion detected'}</span>
                                )}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-0.5">Speech emotion via Hume AI Prosody</div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 px-6 py-3 rounded-lg text-red-700 text-sm font-semibold max-w-md">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Floating Controls at Bottom - light theme like Welcome */}
            {animalType && (
                <div className="absolute bottom-0 left-0 right-0 w-full">
                    <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg p-4 space-y-3">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={isProcessing || isSpeaking}
                                className={`p-4 rounded-full transition-all ${isListening
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                    : 'bg-[#667eea] hover:bg-[#5a6fd6]'
                                    } disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-white`}
                                title={isListening ? 'Stop listening' : 'Start listening'}
                            >
                                {isListening ? (
                                    <Mic size={28} className="text-white" />
                                ) : (
                                    <MicOff size={28} className="text-white" />
                                )}
                            </button>

                            <div className="text-gray-800">
                                <div className="font-semibold text-sm">
                                    {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isProcessing ? 'Processing...' : 'Ready to chat'}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isListening ? 'Speak now' : 'Click mic to speak'}
                                </div>
                            </div>
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