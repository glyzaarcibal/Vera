import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Video } from 'expo-av'
import axiosInstance from '../../utils/axios.instance'

const { width, height } = Dimensions.get('window')

const DIDAgent = ({ navigation, onTranscript, onEnd }) => {
  const [avatarType, setAvatarType] = useState(null)
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('fil')
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [showOutfitPicker, setShowOutfitPicker] = useState(false)
  const [outfitPickerFor, setOutfitPickerFor] = useState(null)
  const [selectedOutfit, setSelectedOutfit] = useState('default')
  const [detectedEmotion, setDetectedEmotion] = useState(null)

  const videoRef = useRef(null)
  const audioRef = useRef(null)

  // API Keys
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
  const GROQ_API_KEY = process.env.GROQ_API_KEY

  // Avatar data
  const AVATARS = {
    'woman-america': {
      name: 'American Woman',
      label: '👩 American Woman',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      icon: 'woman',
    },
    'man-america': {
      name: 'American Man',
      label: '👨 American Man',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      icon: 'man',
    },
    'woman-filipino': {
      name: 'Filipino Woman',
      label: '👩 Filipino Woman',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      icon: 'woman',
    },
    'man-filipino': {
      name: 'Filipino Man',
      label: '👨 Filipino Man',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
      icon: 'man',
    },
  }

  const OUTFITS = {
    default: { label: 'Default' },
    '1': { label: 'Casual' },
    '2': { label: 'Professional' },
    '3': { label: 'Sweater' },
  }

  const languages = [
    { code: 'fil', name: '🇵🇭 Filipino' },
    { code: 'eng', name: '🇺🇸 English' },
  ]

  const AI_PERSONALITY =
    'You are a friendly, helpful AI assistant. Respond in a natural, conversational way with warmth and professionalism. Keep responses concise (2-3 sentences max).'

  // Initialize session
  const initializeSession = async selectedAvatarType => {
    try {
      const avatarData = {
        type: selectedAvatarType,
        label: AVATARS[selectedAvatarType]?.label || selectedAvatarType,
        language: language,
      }

      const res = await axiosInstance.post('/sessions/start-session/Avatar', {
        avatar: avatarData,
      })
      const { session } = res.data
      setSessionId(session.id)
      console.log('Session initialized:', session.id)
      return session
    } catch (e) {
      console.error('Session initialization error:', e)
      Alert.alert('Error', e.response?.data?.message || 'Failed to start session')
    }
  }

  // Handle avatar selection
  const handleAvatarSelect = async type => {
    setOutfitPickerFor(type)
    setShowOutfitPicker(true)
  }

  const handleOutfitSelect = async outfitKey => {
    setSelectedOutfit(outfitKey)
    setShowOutfitPicker(false)
    setAvatarType(outfitPickerFor)
    setOutfitPickerFor(null)
    await initializeSession(outfitPickerFor)
  }

  // Convert blob to base64
  const convertBlobToBase64 = async blob => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Save message to backend
  const saveMessageToBackend = async (message, audioBase64 = null) => {
    if (!sessionId) return null

    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${sessionId}`,
        { message, messages, audioBase64 }
      )
      return res.data
    } catch (e) {
      console.error('Message save error:', e)
      throw e
    }
  }

  // Get AI response from Groq
  const getAIResponse = async (userMessage, audioBase64 = null) => {
    setIsProcessing(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: AI_PERSONALITY,
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          temperature: 0.8,
          max_tokens: 150,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API failed: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content?.trim()

      if (aiResponse) {
        console.log('AI Response:', aiResponse)

        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          text: aiResponse,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, botMessage])

        onTranscript?.(aiResponse, {
          author: AVATARS[avatarType]?.label || 'AI',
          source: 'did',
        })

        if (sessionId) {
          try {
            const saveResult = await saveMessageToBackend({ text: userMessage }, audioBase64)

            const messageId = saveResult?.messageId ?? saveResult?.message_id
            if (messageId && audioBase64) {
              axiosInstance
                .post('/emotion-from-voice', {
                  audioBase64,
                  messageId,
                })
                .then(res => {
                  if (res.data?.saved) {
                    console.log('[DIDAgent] Emotion data saved for message:', messageId)
                  }
                })
                .catch(err => {
                  console.warn('[DIDAgent] Backup emotion save failed:', err?.message)
                })
            }
          } catch (e) {
            console.error('Failed to save message:', e)
          }
        }

        await speakText(aiResponse)
      }
    } catch (err) {
      console.error('AI response error:', err)
      setError(`AI error: ${err.message}`)
      setTimeout(() => setError(null), 3000)
    } finally {
      if (!isSpeaking) {
        setIsProcessing(false)
      }
    }
  }

  // Text-to-speech
  const speakText = async text => {
    setIsProcessing(false)

    try {
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not configured')
      }

      const voiceId = AVATARS[avatarType]?.voiceId

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
              similarity_boost: 0.75,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        setIsSpeaking(true)
        await audioRef.current.play()
      }
    } catch (err) {
      console.error('TTS error:', err)
      setError(`Speech error: ${err.message}`)
      setTimeout(() => setError(null), 3000)
      setIsSpeaking(false)
    }
  }

  // Send text input
  const sendText = async () => {
    if (!input.trim()) return

    const text = input.trim()
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    onTranscript?.(text, { author: 'User', source: 'did' })

    await getAIResponse(text)
  }

  const endSession = () => {
    setAvatarType(null)
    setMessages([])
    setSessionId(null)
    setSelectedOutfit('default')
    if (onEnd) onEnd()
  }

  return (
    <View style={styles.screen}>
      {showOutfitPicker && outfitPickerFor ? (
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              Customize <Text style={styles.headerAccent}>Appearance</Text>
            </Text>
            <Text style={styles.headerSubtitle}>Pick an outfit for your avatar</Text>
          </View>

          <ScrollView
            style={styles.outfitGrid}
            contentContainerStyle={styles.outfitGridContent}
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(OUTFITS).map(([key, outfit]) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleOutfitSelect(key)}
                style={styles.outfitCard}
                activeOpacity={0.8}
              >
                <View style={styles.outfitPlaceholder}>
                  <Ionicons name="person-circle-outline" size={48} color="#7C3AED" />
                </View>
                <Text style={styles.outfitLabel}>{outfit.label}</Text>
                <TouchableOpacity style={styles.selectButton} activeOpacity={0.9}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              setShowOutfitPicker(false)
              setOutfitPickerFor(null)
            }}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : !avatarType ? (
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              Agent <Text style={styles.headerAccent}>Selection</Text>
            </Text>
            <Text style={styles.headerSubtitle}>
              Select a professional AI agent to assist you
            </Text>
          </View>

          <ScrollView
            style={styles.avatarGrid}
            contentContainerStyle={styles.avatarGridContent}
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(AVATARS).map(([type, avatar]) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleAvatarSelect(type)}
                style={styles.avatarCard}
                activeOpacity={0.8}
              >
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name={avatar.icon + '-outline'} size={64} color="#7C3AED" />
                </View>
                <Text style={styles.avatarName}>{avatar.name}</Text>
                <Text style={styles.avatarRole}>Expert Assistant</Text>
                <TouchableOpacity style={styles.connectButton} activeOpacity={0.9}>
                  <Text style={styles.connectButtonText}>Connect Now</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Video player */}
          <View style={styles.videoContainer}>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={64} color="#7C3AED" />
              <Text style={styles.videoPlaceholderText}>
                {AVATARS[avatarType]?.name}
              </Text>
              <Text style={styles.videoPlaceholderSubtext}>Video stream</Text>
            </View>

            {/* HUD Badge */}
            <View style={styles.hudBadge}>
              <View style={styles.hudAvatar}>
                <Ionicons
                  name={AVATARS[avatarType]?.icon + '-outline'}
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View style={styles.hudContent}>
                <Text style={styles.hudName}>{AVATARS[avatarType]?.name}</Text>
                <View style={styles.hudStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      isSpeaking && styles.statusDotSpeaking,
                      isProcessing && styles.statusDotProcessing,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {isSpeaking ? 'Speaking' : isProcessing ? 'Thinking' : 'Online'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Emotion Detection */}
            {detectedEmotion && (
              <View style={styles.emotionBadge}>
                <Ionicons name="flash" size={14} color="#7C3AED" />
                <Text style={styles.emotionText}>
                  {detectedEmotion.emotion} {((detectedEmotion.score ?? 0) * 100).toFixed(0)}%
                </Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={styles.errorBadge}>
                <Ionicons name="warning" size={14} color="#FFFFFF" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Control panel */}
          <View style={styles.controlPanel}>
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  isListening && styles.buttonListening,
                  (isProcessing || isSpeaking) && styles.buttonDisabled,
                ]}
                onPress={() => {}}
                disabled={isProcessing || isSpeaking}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-off'}
                  size={28}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonEnd}
                onPress={endSession}
                activeOpacity={0.8}
              >
                <Ionicons name="call-end" size={28} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonCustomize}
                onPress={() => setShowOutfitPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={22} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            <Text style={styles.statusMessage}>
              {isListening
                ? 'Assistant is listening...'
                : isSpeaking
                  ? 'Assistant is speaking...'
                  : isProcessing
                    ? 'Assistant is thinking...'
                    : 'Voice Command Center'}
            </Text>
          </View>

          {/* Transcript */}
          <ScrollView style={styles.transcript} showsVerticalScrollIndicator={false}>
            {messages.length === 0 ? (
              <View style={styles.emptyTranscript}>
                <Ionicons name="chatbubbles-outline" size={32} color="#CCC4DB" />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : (
              messages.map(msg => (
                <View
                  key={msg.id}
                  style={[styles.messageItem, msg.type === 'user' && styles.userMessage]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.type === 'user' && styles.userMessageText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text style={styles.messageTime}>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#A7A3B8"
              value={input}
              onChangeText={setInput}
              editable={!isProcessing && !isSpeaking}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!input.trim() || isProcessing) && styles.sendButtonDisabled]}
              onPress={sendText}
              disabled={!input.trim() || isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

export default DIDAgent

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  headerAccent: {
    color: '#7C3AED',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7C6B8A',
    lineHeight: 21,
  },
  avatarGrid: {
    flex: 1,
  },
  avatarGridContent: {
    paddingBottom: 20,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    marginBottom: 12,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 4,
  },
  avatarRole: {
    fontSize: 12,
    color: '#7C6B8A',
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outfitGrid: {
    flex: 1,
  },
  outfitGridContent: {
    paddingBottom: 20,
  },
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: 'center',
  },
  outfitPlaceholder: {
    height: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    marginBottom: 12,
  },
  outfitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  videoContainer: {
    height: 280,
    backgroundColor: '#2D1B4E',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    width: '100%',
    height: '100%',
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B4E',
    marginTop: 12,
  },
  videoPlaceholderSubtext: {
    fontSize: 12,
    color: '#A7A3B8',
    marginTop: 4,
  },
  hudBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  hudAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  hudContent: {
    flex: 1,
  },
  hudName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D1B4E',
  },
  hudStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusDotSpeaking: {
    backgroundColor: '#7C3AED',
  },
  statusDotProcessing: {
    backgroundColor: '#D97706',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A7A3B8',
  },
  emotionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emotionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 6,
  },
  errorBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    flex: 1,
  },
  controlPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#DDD6FE',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonListening: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonEnd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  buttonCustomize: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B4E',
    textAlign: 'center',
  },
  transcript: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  emptyTranscript: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#A7A3B8',
    marginTop: 8,
  },
  messageItem: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9F7FF',
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#F5F3FF',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2D1B4E',
    marginBottom: 4,
  },
  userMessageText: {
    color: '#2D1B4E',
  },
  messageTime: {
    fontSize: 11,
    color: '#A7A3B8',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    fontSize: 14,
    color: '#2D1B4E',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
