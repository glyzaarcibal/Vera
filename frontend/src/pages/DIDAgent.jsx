import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import './Welcome.css';
import womanAmericaVideo from '../assets/Unleash+yo.mp4';
import americanGirlVideo from '../assets/american-girl.mp4';
import americanGirl1Video from '../assets/american-girl-1.mp4';
import americanGirl1ThinkingVideo from '../assets/american-girl-1-thinking.mp4';
import americanGirl2Video from '../assets/american-girl-2.mp4';
import americanGirl3Video from '../assets/american-girl-3.mp4';
import manAmericaVideo from '../assets/_Removed+D.mp4';
import womanFilipinoVideo from '../assets/pinoywomen.mp4';
import manFilipinoVideo from '../assets/filipino-boy.mp4';
import americanBoyVideo from '../assets/american-boy.mp4';
import americanBoy1Video from '../assets/american-boy-1.mp4';
import americanBoy2Video from '../assets/american-boy-2.mp4';
import americanBoy3Video from '../assets/american-boy-3.mp4';
import filipinoBoy1Video from '../assets/filipino-boy-1.mp4';
import filipinoBoy2Video from '../assets/filipino-boy-2.mp4';
import filipinoBoy3Video from '../assets/filipino-boy-3.mp4';
import filipinoGirlVideo from '../assets/filipino-girl.mp4';
import filipinoGirl1Video from '../assets/filipino-girl-1.mp4';
import filipinoGirl2Video from '../assets/filipino-girl-2.mp4';
import filipinoGirl3Video from '../assets/filipino-girl-3.mp4';
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


export default function DIDAgent({ onTranscript, onEnd }) {
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

  // Validate API keys
  useEffect(() => {
    if (!ELEVENLABS_API_KEY) {
      console.warn("ELEVENLABS_API_KEY missing in frontend/.env");
      setError("ElevenLabs API key not configured. Add VITE_ELEVENLABS_API_KEY to frontend/.env");
    }
  }, []);

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

  const AMERICAN_BOY_VIDEOS = {
    default: americanBoyVideo,
    '1': americanBoy1Video,
    '2': americanBoy2Video,
    '3': americanBoy3Video
  };

  const FILIPINO_BOY_VIDEOS = {
    default: manFilipinoVideo,
    '1': filipinoBoy1Video,
    '2': filipinoBoy2Video,
    '3': filipinoBoy3Video
  };

  const FILIPINO_GIRL_VIDEOS = {
    default: filipinoGirlVideo,
    '1': filipinoGirl1Video,
    '2': filipinoGirl2Video,
    '3': filipinoGirl3Video
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
    if (avatarType === 'man-america') {
      return AMERICAN_BOY_VIDEOS[selectedAmericanBoyOutfit] || americanBoyVideo;
    }
    if (avatarType === 'man-filipino') {
      return FILIPINO_BOY_VIDEOS[selectedFilipinoBoyOutfit] || manFilipinoVideo;
    }
    if (avatarType === 'woman-filipino') {
      return FILIPINO_GIRL_VIDEOS[selectedFilipinoOutfit] || filipinoGirlVideo;
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

  // Save message to backend (returns { response, messageId } for emotion backup)
  const saveMessageToBackend = async (message, audioBase64 = null) => {
    if (!sessionId) return null;

    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${sessionId}`,
        { message, messages, audioBase64 }
      );
      return res.data; // Return full response including messageId for emotion save
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

        // Emotion-Detection-By-Voice via Hume AI (non-blocking) — label visible so you know it's working
        // First call: just for UI display (no messageId yet). 90s timeout: Hume batch can take 30–60s
        axiosInstance.post('/emotion-from-voice', { audioBase64 }, { timeout: 90000 })
          .then((res) => {
            const data = res.data;
            const source = data?.source || 'Hume AI';
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
            const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? (err?.code === 'ECONNABORTED' ? 'Request timed out' : err?.message ?? 'Unavailable');
            console.warn('Emotion detection (Hume AI) skipped:', msg);
            setDetectedEmotion({ emotion: null, score: 0, source: 'Hume AI', error: msg });
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

        // Save to backend (includes user message + audio for emotion detection)
        if (sessionId) {
          try {
            const saveResult = await saveMessageToBackend(
              { text: userMessage },
              audioBase64
            );

            // Backup: Call emotion-from-voice with messageId to ensure emotions are saved
            // (process-message saves via transcribeAudio, but this backup handles edge cases)
            const messageId = saveResult?.messageId ?? saveResult?.message_id;
            if (messageId && audioBase64) {
              axiosInstance.post('/emotion-from-voice', {
                audioBase64,
                messageId
              }).then(res => {
                if (res.data?.saved) {
                  console.log('[DIDAgent] Emotion data saved to database for message:', messageId);
                }
              }).catch(err => {
                console.warn('[DIDAgent] Backup emotion save failed (non-critical):', err?.response?.data || err.message);
              });
            }
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
      if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key not set. Add VITE_ELEVENLABS_API_KEY to frontend/.env");
      }

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
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error(`ElevenLabs API key invalid (401). Check VITE_ELEVENLABS_API_KEY in frontend/.env`);
        }
        throw new Error(`TTS failed: ${response.status} - ${errorText}`);
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
    <div className="page-container flex flex-col items-center">
      {showOutfitPicker && outfitPickerFor ? (
        <div className="w-full">
          <div className="page-header">
            <h1 className="page-title">
              Customize <span className="gradient-text">Appearance</span>
            </h1>
            <p className="page-subtitle">{getOutfitPickerSubtitle()}</p>
          </div>

          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 w-full max-w-4xl mx-auto pb-6 snap-x snap-mandatory scrollbar-hide-custom px-4 lg:px-0">
            {Object.entries(getOutfitsForPicker()).map(([key, { img, label }]) => (
              <button
                key={key}
                onClick={() => handleOutfitSelect(key)}
                className="design-section glass-card group p-6 flex flex-col items-center text-center hover:scale-[1.05] transition-all duration-500 flex-shrink-0 w-[200px] lg:w-full snap-center"
              >
                <div className="w-28 h-28 rounded-2xl overflow-hidden mb-4 shadow-lg ring-2 ring-white/50 group-hover:ring-indigo-400/50 transition-all duration-500">
                  <img src={img} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <span className="font-extrabold text-slate-800 text-sm tracking-tight">{label}</span>
                <div className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  Select Style
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => { setShowOutfitPicker(false); setOutfitPickerFor(null); }}
              className="px-8 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-500 font-bold text-sm tracking-widest uppercase hover:bg-gray-50 transition-all"
            >
              Back to selection
            </button>
          </div>
        </div>
      ) : !avatarType ? (
        <div className="w-full">
          <div className="page-header">
            <h1 className="page-title">
              Agent <span className="gradient-text">Selection</span>
            </h1>
            <p className="page-subtitle">Select a professional AI agent to assist you today</p>
          </div>

          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-8 w-full pb-12 snap-x snap-mandatory scrollbar-hide-custom px-4 lg:px-0">
            {Object.entries(AVATAR_IMAGES).map(([type, img]) => (
              <button
                key={type}
                onClick={() => handleAvatarSelect(type)}
                className="design-section glass-card group p-8 flex flex-col items-center text-center transition-all duration-500 flex-shrink-0 w-[280px] lg:w-full snap-center"
              >
                <div className="w-40 h-40 rounded-[32px] overflow-hidden mb-6 shadow-2xl ring-4 ring-white/50 group-hover:ring-indigo-400/50 transition-all duration-500">
                  <img src={img} alt={type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <h3 className="section-title text-xl mb-2 capitalize">{type.replace('-', ' ')}</h3>
                <p className="text-[10px] text-indigo-500/60 uppercase font-black tracking-[0.2em] mb-6">Expert Assistant</p>
                <div className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
                  Connect Now
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
          <div className="design-section w-full p-0 overflow-hidden relative shadow-2xl border-4 border-white bg-gray-900 rounded-3xl flex items-center justify-center">
            <video
              ref={videoRef}
              src={getCurrentVideo()}
              className="w-full h-full"
              style={{ objectFit: 'contain' }}
              playsInline
              loop={!isSpeaking && !isProcessing}
              muted={true}
            />

            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-4 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white/50">
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md">
                <img src={AVATAR_IMAGES[avatarType]} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-widest leading-tight">{avatarType.replace('-', ' ')}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-indigo-500 animate-ping' : isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Online'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAvatarType(null);
                  setMessages([]);
                  setSessionId(null);
                }}
                className="ml-4 p-2 hover:bg-gray-100 rounded-xl transition-all"
                title="Change Agent"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {detectedEmotion && (
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md shadow-xl px-5 py-3 rounded-2xl border border-white/50 animate-in slide-in-from-top-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-indigo-600 bg-indigo-50 p-1 rounded-md">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Analysis</span>
                </div>
                <p className="text-indigo-600 font-bold text-lg leading-tight">
                  {detectedEmotion.emotion} <span className="text-[10px] text-gray-400 font-normal ml-1">{(detectedEmotion.score * 100).toFixed(0)}%</span>
                </p>
              </div>
            )}

            {error && (
              <div className="absolute bottom-6 left-6 right-6 bg-rose-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-xl border border-rose-400/50 flex items-center justify-between text-sm font-bold uppercase tracking-widest animate-in slide-in-from-bottom-10">
                <div className="flex items-center gap-3">
                  <span>⚠️</span>
                  {error}
                </div>
                <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
              </div>
            )}
          </div>

          <div className="w-full max-w-2xl">
            <div className="glass-card w-full border border-white/50 shadow-2xl rounded-[40px] p-6 flex flex-col items-center gap-6 transition-all hover:shadow-indigo-100/50">

              <div className="flex items-center justify-center gap-6 w-full">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isProcessing || isSpeaking}
                  className={`p-7 rounded-[28px] transition-all duration-500 transform active:scale-95 shadow-xl ${isListening
                    ? 'bg-rose-500 shadow-rose-200 animate-pulse'
                    : 'bg-gradient-to-r from-[#6366f1] to-[#a855f7] shadow-indigo-200 hover:shadow-indigo-300'
                    } disabled:opacity-50 disabled:grayscale text-white`}
                  title={isListening ? 'Stop Listening' : 'Start Listening'}
                >
                  {isListening ? <Mic size={32} /> : <MicOff size={32} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onEnd) onEnd();
                    setAvatarType(null);
                    setMessages([]);
                    setSessionId(null);
                  }}
                  className="p-7 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-[28px] transition-all border border-rose-100 shadow-sm hover:shadow-md active:scale-95"
                  title="End Conversation"
                >
                  <PhoneOff size={32} />
                </button>

                <button
                  onClick={() => setShowOutfitPicker(true)}
                  className="absolute right-8 p-4 bg-slate-50 hover:bg-white hover:shadow-md text-slate-600 rounded-2xl transition-all border border-slate-100 hidden md:flex"
                  title="Customize Appearance"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>

              <div className="text-center">
                <div className="text-slate-800 font-extrabold text-base tracking-tight mb-1">
                  {isListening ? 'Assistant is listening...' : isSpeaking ? 'Assistant is speaking...' : isProcessing ? 'Assistant is thinking...' : 'Voice Command Center'}
                </div>
                {!isListening && !isSpeaking && !isProcessing && (
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest opacity-60">Center Mic to start chatting</p>
                )}
              </div>
            </div>

            <audio ref={audioRef} onEnded={handleAudioEnd} className="hidden" />

            {detectedEmotion && (
              <p className="mt-4 text-center text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">
                Voice Analysis powered by Hume AI
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}