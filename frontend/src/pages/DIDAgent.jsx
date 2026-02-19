import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import './Welcome.css';
import womanAmericaVideo from '../assets/Unleash+yo.mp4';
import americanGirlVideo from '../assets/american-girl.mp4';
import americanGirl1Video from '../assets/american-girl-1.mp4';
import americanGirl1ThinkingVideo from '../assets/american-girl-1-thinking.mp4';
import americanGirl2Video from '../assets/american-girl-2.mp4';
import americanGirl3Video from '../assets/american-girl-3.mp4';
import manAmericaVideo from '../assets/_Removed+D.mp4';
import womanFilipinoVideo from '../assets/pinoywomen.mp4';
import manFilipinoVideo from '../assets/pinoyman.mp4';
import americanGirlImg from '../assets/american-girl.png';
import americanGirl1 from '../assets/american-girl-1.png';
import americanGirl2 from '../assets/american-girl-2.png';
import americanGirl3 from '../assets/american-girl-3.png';
import americanBoyImg from '../assets/american-boy.png';
import americanBoy1 from '../assets/american-boy-1.png';
import americanBoy2 from '../assets/american-boy-2.png';
import americanBoy3 from '../assets/american-boy-3.png';
import filipinoGirlImg from '../assets/filipino-girl.png';
import filipinoGirl1 from '../assets/filipino-girl-1.png';
import filipinoGirl2 from '../assets/filipino-girl-2.png';
import filipinoGirl3 from '../assets/filipino-girl-3.png';
import filipinoBoyImg from '../assets/filipino-boy.png';
import filipinoBoy1 from '../assets/filipino-boy-1.png';
import filipinoBoy2 from '../assets/filipino-boy-2.png';
import filipinoBoy3 from '../assets/filipino-boy-3.png';
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
  const [showOutfitPicker, setShowOutfitPicker] = useState(false);
  const [outfitPickerFor, setOutfitPickerFor] = useState(null); // 'woman-america' | 'woman-filipino' | 'man-filipino' | 'man-america'
  const [selectedAmericanGirlOutfit, setSelectedAmericanGirlOutfit] = useState('default');
  const [selectedFilipinoOutfit, setSelectedFilipinoOutfit] = useState('default');
  const [selectedFilipinoBoyOutfit, setSelectedFilipinoBoyOutfit] = useState('default');
  const [selectedAmericanBoyOutfit, setSelectedAmericanBoyOutfit] = useState('default');
  const [detectedEmotion, setDetectedEmotion] = useState(null); // { emotion, score } from Emotion-Detection-By-Voice

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

  // American Girl outfit videos (talking; outfit 1 also has thinking video)
  const AMERICAN_GIRL_VIDEOS = {
    default: americanGirlVideo,
    '1': americanGirl1Video,
    '2': americanGirl2Video,
    '3': americanGirl3Video
  };

  const getAmericanGirlThinkingVideo = () => {
    if (selectedAmericanGirlOutfit === '1') return americanGirl1ThinkingVideo;
    return AMERICAN_GIRL_VIDEOS[selectedAmericanGirlOutfit] || americanGirlVideo;
  };

  // Get current video based on avatar type, outfit, and state
  const getCurrentVideo = () => {
    if (avatarType === 'woman-america') {
      if (isSpeaking) {
        return AMERICAN_GIRL_VIDEOS[selectedAmericanGirlOutfit] || americanGirlVideo;
      }
      if (isProcessing) {
        return getAmericanGirlThinkingVideo();
      }
      return AMERICAN_GIRL_VIDEOS[selectedAmericanGirlOutfit] || americanGirlVideo;
    }
    return VIDEO_MAP[avatarType] || womanAmericaVideo;
  };

  // Avatar selection images (replacing icon/emoji)
  const AVATAR_IMAGES = {
    'woman-america': americanGirlImg,
    'man-america': americanBoyImg,
    'woman-filipino': filipinoGirlImg,
    'man-filipino': filipinoBoyImg
  };

  // American Girl outfit options (choose outfit when user picks American Woman)
  const AMERICAN_GIRL_OUTFITS = {
    default: { img: americanGirlImg, label: 'Default' },
    '1': { img: americanGirl1, label: 'Casual' },
    '2': { img: americanGirl2, label: 'Professional' },
    '3': { img: americanGirl3, label: 'Sweater' }
  };

  // Filipino Woman outfit options (choose outfit when user picks Filipino Woman)
  const FILIPINO_OUTFITS = {
    default: { img: filipinoGirlImg, label: 'Default' },
    '1': { img: filipinoGirl1, label: 'Casual' },
    '2': { img: filipinoGirl2, label: 'Professional' },
    '3': { img: filipinoGirl3, label: 'Sweater' }
  };

  // Filipino Boy outfit options (choose outfit when user picks Filipino Man)
  const FILIPINO_BOY_OUTFITS = {
    default: { img: filipinoBoyImg, label: 'Default' },
    '1': { img: filipinoBoy1, label: 'Casual' },
    '2': { img: filipinoBoy2, label: 'Professional' },
    '3': { img: filipinoBoy3, label: 'Sweater' }
  };

  // American Boy outfit options (choose outfit when user picks American Man)
  const AMERICAN_BOY_OUTFITS = {
    default: { img: americanBoyImg, label: 'Default' },
    '1': { img: americanBoy1, label: 'Casual' },
    '2': { img: americanBoy2, label: 'Professional' },
    '3': { img: americanBoy3, label: 'Sweater' }
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

  // Handle avatar selection (for American Woman/Man, Filipino Woman/Man: show outfit picker first)
  const handleAvatarSelect = async (type) => {
    if (type === 'woman-america') {
      setOutfitPickerFor('woman-america');
      setShowOutfitPicker(true);
      return;
    }
    if (type === 'woman-filipino') {
      setOutfitPickerFor('woman-filipino');
      setShowOutfitPicker(true);
      return;
    }
    if (type === 'man-filipino') {
      setOutfitPickerFor('man-filipino');
      setShowOutfitPicker(true);
      return;
    }
    if (type === 'man-america') {
      setOutfitPickerFor('man-america');
      setShowOutfitPicker(true);
      return;
    }
    setAvatarType(type);
    await initializeSession(type);
  };

  const getOutfitsForPicker = () => {
    if (outfitPickerFor === 'woman-america') return AMERICAN_GIRL_OUTFITS;
    if (outfitPickerFor === 'woman-filipino') return FILIPINO_OUTFITS;
    if (outfitPickerFor === 'man-america') return AMERICAN_BOY_OUTFITS;
    if (outfitPickerFor === 'man-filipino') return FILIPINO_BOY_OUTFITS;
    return FILIPINO_OUTFITS;
  };

  const getOutfitPickerSubtitle = () => {
    if (outfitPickerFor === 'woman-america') return 'Change outfit — pick one for your avatar';
    if (outfitPickerFor === 'woman-filipino') return 'Pick an outfit for your Filipino Woman avatar';
    if (outfitPickerFor === 'man-filipino') return 'Pick an outfit for your Filipino Man avatar';
    if (outfitPickerFor === 'man-america') return 'Pick an outfit for your American Man avatar';
    return '';
  };

  const handleOutfitSelect = async (outfitKey) => {
    const isChangingOutfit = avatarType === outfitPickerFor; // already in session, just changing outfit
    if (outfitPickerFor === 'woman-america') {
      setSelectedAmericanGirlOutfit(outfitKey);
      setShowOutfitPicker(false);
      setOutfitPickerFor(null);
      if (!isChangingOutfit) {
        setAvatarType('woman-america');
        await initializeSession('woman-america');
      }
    } else if (outfitPickerFor === 'woman-filipino') {
      setSelectedFilipinoOutfit(outfitKey);
      setShowOutfitPicker(false);
      setOutfitPickerFor(null);
      if (!isChangingOutfit) {
        setAvatarType('woman-filipino');
        await initializeSession('woman-filipino');
      }
    } else if (outfitPickerFor === 'man-filipino') {
      setSelectedFilipinoBoyOutfit(outfitKey);
      setShowOutfitPicker(false);
      setOutfitPickerFor(null);
      if (!isChangingOutfit) {
        setAvatarType('man-filipino');
        await initializeSession('man-filipino');
      }
    } else if (outfitPickerFor === 'man-america') {
      setSelectedAmericanBoyOutfit(outfitKey);
      setShowOutfitPicker(false);
      setOutfitPickerFor(null);
      if (!isChangingOutfit) {
        setAvatarType('man-america');
        await initializeSession('man-america');
      }
    }
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

        // Emotion-Detection-By-Voice via Hugging Face (non-blocking) — label visible so you know it's working
        axiosInstance.post('/emotion-from-voice', { audioBase64 })
          .then((res) => {
            const data = res.data;
            const source = data?.source || 'Hugging Face';
            if (data?.emotion) {
              setDetectedEmotion({
                emotion: data.emotion,
                score: data.score ?? 0,
                source,
              });
            } else if (data?.error) {
              setDetectedEmotion({ emotion: null, score: 0, source, error: data.error });
            }
          })
          .catch((err) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
            console.warn('Emotion detection (Hugging Face) skipped:', msg);
            setDetectedEmotion({ emotion: null, score: 0, source: 'Hugging Face', error: msg });
          });

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

        // Show AI reply in parent conversation panel
        onTranscript?.(aiResponse, {
          author: avatarType ? AVATAR_LABELS[avatarType] : 'AI',
          source: 'did',
        });

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

        // Text-to-speech - don't set isProcessing to false yet, let speakText handle the transition
        await speakText(aiResponse);
      }
    } catch (err) {
      console.error('AI response error:', err);
      setError(`AI error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      // Only set isProcessing to false if we're not speaking (in case speakText failed or hasn't started)
      if (!isSpeaking) {
        setIsProcessing(false);
      }
    }
  };

  // Text-to-speech using ElevenLabs — when ready, start video and speech together (sabay)
  const speakText = async (text) => {
    setIsProcessing(false);
    // Don't set isSpeaking(true) yet — wait until we have audio and start both together

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

      if (!audioRef.current) return;

      // Set audio source first
      audioRef.current.src = audioUrl;

      const video = videoRef.current;

      // Start video and speech at the same time (sabay) — set isSpeaking only when we actually start
      const startBoth = () => {
        setIsSpeaking(true);
        audioRef.current?.play().catch(e => console.error('Audio play error:', e));
        videoRef.current?.play().catch(e => console.error('Video play error:', e));
      };

      // American Girl outfits 1/2/3: set talking video and wait for it to be ready, then start both together (sabay)
      const americanGirlTalkingVideo = AMERICAN_GIRL_VIDEOS[selectedAmericanGirlOutfit];
      if (video && avatarType === 'woman-america' && americanGirlTalkingVideo) {
        video.src = americanGirlTalkingVideo;
        video.load();
        let started = false;
        const startOnce = () => {
          if (started) return;
          started = true;
          startBoth();
        };
        if (video.readyState >= 2) {
          startOnce();
        } else {
          video.addEventListener('canplay', startOnce, { once: true });
        }
      } else if (video) {
        // Other avatars: video already loaded, start audio and video together (sabay)
        startBoth();
      } else {
        setIsSpeaking(true);
        audioRef.current.play().catch(e => console.error('Audio play error:', e));
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

    const text = input.trim();
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Show user message in parent conversation panel
    onTranscript?.(text, { author: 'User', source: 'did' });

    await getAIResponse(text);
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

  // Update video source when state changes (for American Girl outfits 1, 2, 3)
  useEffect(() => {
    if (videoRef.current && avatarType === 'woman-america') {
      const newVideoSrc = getCurrentVideo();
      const currentSrc = videoRef.current.currentSrc || videoRef.current.src || '';
      const newSrcString = typeof newVideoSrc === 'string' 
        ? newVideoSrc 
        : newVideoSrc?.default || newVideoSrc;
      
      const currentFilename = currentSrc.split('/').pop() || '';
      const newFilename = newSrcString.split('/').pop() || '';
      
      if (currentFilename !== newFilename && newFilename) {
        const wasPlaying = !videoRef.current.paused;
        videoRef.current.src = newVideoSrc;
        videoRef.current.load();
        
        if (wasPlaying || isSpeaking || isProcessing) {
          videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
      } else if (isSpeaking || isProcessing) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
      }
    }
  }, [isProcessing, isSpeaking, avatarType, selectedAmericanGirlOutfit]);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col flex-1 bg-[#fafbfc]">
      {/* Choose outfit — shown when first picking avatar OR when clicking "Change Outfit" */}
      {showOutfitPicker && outfitPickerFor && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 z-20 overflow-auto min-h-0">
          <div className="text-center max-w-2xl w-full space-y-3 sm:space-y-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => { setShowOutfitPicker(false); setOutfitPickerFor(null); }}
              className="text-sm text-gray-500 hover:text-[#667eea] font-medium mb-2"
            >
              {avatarType ? '← Back' : '← Back to avatars'}
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">
              Choose <span className="gradient-text">Outfit</span>
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              {getOutfitPickerSubtitle()}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {Object.entries(getOutfitsForPicker()).map(([key, { img, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleOutfitSelect(key)}
                  className="bg-white rounded-xl border-2 border-transparent hover:border-[#667eea] transition-all hover:shadow-md text-center cursor-pointer py-3 px-2"
                >
                  <div className="mb-1.5 flex justify-center">
                    <img
                      src={img}
                      alt={label}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full border border-gray-200"
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Selection Screen - same style as Welcome */}
      {!avatarType && !showOutfitPicker && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 z-10 overflow-auto min-h-0">
          <div className="text-center max-w-3xl w-full space-y-3 sm:space-y-4 flex-shrink-0">
            <div className="hero-badge text-xs py-1.5 px-3">Human Agent</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">
              Choose Your <span className="gradient-text">Avatar</span>
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Select an avatar to begin your AI-powered conversation
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {[
                { type: 'woman-america', label: 'American Woman', desc: 'Professional female voice', accent: 'pink' },
                { type: 'man-america', label: 'American Man', desc: 'Professional male voice', accent: 'blue' },
                { type: 'woman-filipino', label: 'Filipino Woman', desc: 'Warm female voice', accent: 'purple' },
                { type: 'man-filipino', label: 'Filipino Man', desc: 'Friendly male voice', accent: 'indigo' }
              ].map(({ type, label, desc, accent }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAvatarSelect(type)}
                  className="feature-card text-center cursor-pointer border-2 border-transparent hover:border-[#667eea] transition-all hover:shadow-md py-3 px-2"
                >
                  <div className="mb-1.5 flex justify-center">
                    <img
                      src={AVATAR_IMAGES[type]}
                      alt={label}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-full border border-gray-200"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">{label}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 transition-opacity">
                    Choose
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video - Full Screen (hidden when outfit picker is open) */}
      {avatarType && !showOutfitPicker && (
        <div className="relative flex-1 flex flex-col items-center justify-center min-h-0 w-full">
          <video
            ref={videoRef}
            src={getCurrentVideo()}
            className="w-full h-full min-h-0 object-contain"
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => console.log('Video loaded successfully')}
            onError={(e) => console.error('Video load error:', e)}
          />

          {/* Avatar Badge - light theme like Welcome */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md shadow-md px-4 py-2 rounded-full flex items-center gap-2 border border-gray-100">
            {avatarType === 'woman-america' && (
              <img
                src={AMERICAN_GIRL_OUTFITS[selectedAmericanGirlOutfit].img}
                alt="Outfit"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            )}
            {avatarType === 'woman-filipino' && (
              <img
                src={FILIPINO_OUTFITS[selectedFilipinoOutfit].img}
                alt="Outfit"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            )}
            {avatarType === 'man-filipino' && (
              <img
                src={FILIPINO_BOY_OUTFITS[selectedFilipinoBoyOutfit].img}
                alt="Outfit"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            )}
            {avatarType === 'man-america' && (
              <img
                src={AMERICAN_BOY_OUTFITS[selectedAmericanBoyOutfit].img}
                alt="Outfit"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            )}
            <span className="text-gray-900 font-semibold">{AVATAR_LABELS[avatarType]}</span>
            <button
              type="button"
              onClick={() => {
                setOutfitPickerFor(avatarType);
                setShowOutfitPicker(true);
              }}
              className="ml-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors font-medium"
            >
              Change Outfit
            </button>
            <button
              type="button"
              onClick={() => {
                setAvatarType(null);
                setSessionId(null);
                setMessages([]);
                setShowOutfitPicker(false);
                setOutfitPickerFor(null);
              }}
              className="ml-1 text-xs bg-[#667eea] hover:bg-[#5a6fd6] text-white px-2 py-1 rounded transition-colors font-medium"
            >
              Choose Avatar
            </button>
          </div>

          {/* Speaking indicator overlay */}
          {isSpeaking && (
            <div className="absolute inset-0 border-4 border-[#667eea] animate-pulse pointer-events-none rounded-2xl"></div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg px-6 py-3 rounded-full text-gray-800 text-sm font-semibold border border-gray-100">
              Thinking...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 px-6 py-3 rounded-lg text-red-700 text-sm font-semibold max-w-md">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Floating Controls at Bottom - voice only (hidden when outfit picker is open) */}
      {avatarType && !showOutfitPicker && (
        <div className="absolute bottom-0 left-0 right-0 w-full">
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg p-4">
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
                {detectedEmotion && (
                  <div className="mt-1 text-xs font-medium">
                    <span className="text-[#667eea]">
                      {detectedEmotion.source || 'Hugging Face'}:{' '}
                      {detectedEmotion.emotion
                        ? (
                            <>
                              {detectedEmotion.emotion}
                              {detectedEmotion.score > 0 && (
                                <span className="text-gray-500 ml-1">
                                  ({Math.round(detectedEmotion.score * 100)}%)
                                </span>
                              )}
                            </>
                          )
                        : (
                            <span className="text-amber-600">
                              {detectedEmotion.error || 'No emotion detected'}
                            </span>
                          )}
                    </span>
                  </div>
                )}
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