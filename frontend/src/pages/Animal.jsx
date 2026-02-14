import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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

    // Save message to backend
    const saveMessageToBackend = async (message, audioBase64 = null) => {
        if (!sessionId) return;

        try {
            await axiosInstance.post(
                `/messages/process-message/${sessionId}`,
                { message, messages, audioBase64 }
            );
        } catch (e) {
            console.error('Message save error:', e);
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

                // Save to backend
                if (sessionId) {
                    await saveMessageToBackend({ text: userMessage }, audioBase64);
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
        <div className="h-full flex flex-col items-center justify-center relative bg-transparent">
            {/* Avatar Selection Screen */}
            {!animalType && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
                    <div className="text-center space-y-8 p-8">
                        <h1 className="text-5xl font-bold text-white mb-4">Choose Your AI Companion</h1>
                        <p className="text-xl text-gray-200 mb-8">Select an avatar to chat with</p>

                        <div className="flex gap-6 justify-center flex-wrap max-w-5xl">
                            {/* Cat Option */}
                            <button
                                onClick={() => handleAnimalSelect('cat')}
                                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-3xl p-8 transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-pink-400"
                            >
                                <div className="text-center space-y-4">
                                    <div className="text-8xl">🐱</div>
                                    <h2 className="text-3xl font-bold text-white">Cat</h2>
                                    <p className="text-gray-300 max-w-xs">Playful and sassy feline friend with purr-fect personality</p>
                                    <div className="px-6 py-3 bg-pink-500 rounded-full text-white font-semibold group-hover:bg-pink-600 transition-colors">
                                        Choose Cat
                                    </div>
                                </div>
                            </button>

                            {/* Dog Option */}
                            <button
                                onClick={() => handleAnimalSelect('dog')}
                                className="group relative bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-3xl p-8 transition-all hover:scale-105 hover:shadow-2xl border-4 border-transparent hover:border-yellow-400"
                            >
                                <div className="text-center space-y-4">
                                    <div className="text-8xl">🐶</div>
                                    <h2 className="text-3xl font-bold text-white">Dog</h2>
                                    <p className="text-gray-300 max-w-xs">Enthusiastic and loyal canine companion with endless energy</p>
                                    <div className="px-6 py-3 bg-yellow-500 rounded-full text-white font-semibold group-hover:bg-yellow-600 transition-colors">
                                        Choose Dog
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video - Full Screen */}
            {animalType && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <video
                        ref={videoRef}
                        src={VIDEO_MAP[animalType]}
                        className="w-full h-full object-contain"
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onLoadedData={() => console.log('Video loaded successfully')}
                        onError={(e) => console.error('Video load error:', e)}
                    />

                    {/* Avatar Type Badge */}
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="text-2xl">
                            {animalType === 'cat' ? '🐱' : '🐶'}
                        </span>
                        <span className="text-white font-semibold capitalize">
                            {`${animalType} AI`}
                        </span>
                        <button
                            onClick={() => {
                                setAnimalType(null);
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
            {animalType && (
                <div className="absolute bottom-0 left-0 right-0 w-full">
                    <div className="bg-black/80 backdrop-blur-md p-4 space-y-3">
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
                                    {isListening ? 'Speak now' : 'Click mic or type below'}
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