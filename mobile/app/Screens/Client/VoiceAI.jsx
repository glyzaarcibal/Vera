import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import axiosInstance from '../../utils/axios.instance'

const VOICES = [
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    gender: 'Man',
    avatar: 'V',
    image: require('../../../assets/man1.jpg'), // Add image path
    gradient: 'from-indigo-500 to-purple-600',
    colors: ['#6366f1', '#9333ea'],
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    gender: 'Woman',
    avatar: 'V',
    image: require('../../../assets/woman1.jpg'), // Add image path
    gradient: 'from-pink-500 to-rose-600',
    colors: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    gender: 'Man',
    avatar: 'V',
    image: require('../../../assets/man2.jpg'), // Add image path
    gradient: 'from-blue-500 to-cyan-600',
    colors: ['#3b82f6', '#0891b2'],
  },
  {
    id: 'SAz9YHcvj6GT2YYXdXww',
    gender: 'Woman',
    avatar: 'V',
    image: require('../../../assets/woman2.jpg'), // Add image path
    gradient: 'from-purple-500 to-fuchsia-600',
    colors: ['#a855f7', '#c026d3'],
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    gender: 'Man',
    avatar: 'V',
    image: require('../../../assets/man3.jpg'), // Add image path
    gradient: 'from-green-500 to-emerald-600',
    colors: ['#22c55e', '#059669'],
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    gender: 'Woman',
    avatar: 'V',
    image: require('../../../assets/woman3.jpg'), // Add image path
    gradient: 'from-orange-500 to-red-600',
    colors: ['#f97316', '#dc2626'],
  },
]

const VoiceAI = () => {
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversationMode, setConversationMode] = useState('listening')
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0)
  const [recording, setRecording] = useState(null)
  const [transcript, setTranscript] = useState('')
  const scrollViewRef = useRef(null)
  const audioPlayerRef = useRef(null)

  useEffect(() => {
    let interval
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [isCallActive])

  const initializeSession = async () => {
    try {
      const res = await axiosInstance.post('/sessions/start-session/voice', {
        voice: VOICES[selectedVoiceIndex],
      })
      const { session } = res.data
      setSessionId(session.id)
      return session
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Internal Server Error')
    }
  }

  const convertAudioToBase64 = async uri => {
    try {
      const response = await fetch(uri)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1]
          resolve(base64String)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting audio to base64:', error)
      throw error
    }
  }

  const transcribeAudio = async audioUri => {
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      })
      formData.append('model_id', 'scribe_v1')
      formData.append('language_code', 'en')

      const response = await fetch(
        'https://api.elevenlabs.io/v1/speech-to-text',
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
          },
          body: formData,
        },
      )

      const result = await response.json()
      console.log(result)
      return result.text
    } catch (error) {
      console.error('Error transcribing audio:', error)
      Alert.alert('Error', 'Failed to transcribe audio')
      throw error
    }
  }

  const fetchBotResponse = async (message, audioBase64) => {
    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${sessionId}`,
        { message, messages, audioBase64 },
      )
      return res.data.response
    } catch (error) {
      console.error('Error fetching bot response:', error)
      Alert.alert('Error', 'Failed to get bot response')
      throw error
    }
  }

  const speakText = async text => {
    try {
      const voiceId = VOICES[selectedVoiceIndex].id

      if (!process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY) {
        console.error('ElevenLabs API key is missing!')
        Alert.alert('Error', 'ElevenLabs API key is not configured')
        setConversationMode('listening')
        return
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBlob = await response.blob()
      const reader = new FileReader()

      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1]
        const { sound } = await Audio.Sound.createAsync({
          uri: `data:audio/mp3;base64,${base64Data}`,
        })

        audioPlayerRef.current = sound

        sound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) {
            setConversationMode('listening')
            sound.unloadAsync()
            audioPlayerRef.current = null
          }
        })

        await sound.playAsync()
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Text-to-speech error:', error)
      Alert.alert('Error', 'Failed to generate speech')
      setConversationMode('listening')
    }
  }

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  const handleCallToggle = async () => {
    if (sessionId === null) await initializeSession()
    setIsCallActive(!isCallActive)

    if (!isCallActive) {
      setIsListening(true)
      setTranscript('')
      await startRecording()
    } else {
      setIsListening(false)
      setIsMuted(false)
      setTranscript('')
      if (recording) {
        await stopRecording()
      }
    }
  }

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio permissions')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      )
      setRecording(newRecording)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }

  const stopRecording = async () => {
    setIsRecording(false)
    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    setRecording(null)
    return uri
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleRecordingToggle = async () => {
    if (isRecording) {
      try {
        console.log('Stopping recording...')
        const uri = await stopRecording()
        setIsListening(false)

        console.log('Recording URI:', uri)

        // Transcribe audio using ElevenLabs STT
        setConversationMode('thinking')
        const transcribedText = await transcribeAudio(uri)
        console.log('Transcript:', transcribedText)
        setTranscript(transcribedText)

        if (transcribedText && transcribedText.trim()) {
          // Convert audio to base64
          const audioBase64 = await convertAudioToBase64(uri)
          console.log('Audio base64 length:', audioBase64.length)

          // Add user message to messages array
          const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: transcribedText.trim(),
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, userMessage])

          // Fetch bot response with audio base64
          const botResponse = await fetchBotResponse(
            userMessage.text,
            audioBase64,
          )

          if (botResponse) {
            // Add bot message to messages array
            const botMessage = {
              id: messages.length + 2,
              type: 'bot',
              text: botResponse,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, botMessage])

            // Switch to speaking mode and play TTS
            setConversationMode('speaking')
            await speakText(botResponse)
          } else {
            setConversationMode('listening')
          }

          // Clear transcript for next input
          setTranscript('')
        } else {
          setConversationMode('listening')
        }
      } catch (error) {
        console.error('Error processing recording:', error)
        setConversationMode('listening')
      }
    } else {
      console.log('Starting recording...')
      await startRecording()
      setIsListening(true)
      setConversationMode('listening')
    }
  }

  const handleVoiceSelect = index => {
    setSelectedVoiceIndex(index)
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-2xl items-center gap-12">
          {!isCallActive ? (
            <View className="w-full py-8">
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x /
                      Dimensions.get('window').width,
                  )
                  setSelectedVoiceIndex(index)
                }}
              >
                {VOICES.map((voice, index) => (
                  <View
                    key={voice.id}
                    className="items-center justify-center"
                    style={{ width: Dimensions.get('window').width - 48 }}
                  >
                    <TouchableOpacity
                      onPress={() => handleVoiceSelect(index)}
                      className="items-center"
                    >
                      <View className="w-52 h-52 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500">
                        <Image
                          source={voice.image}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <Text className="text-sm font-semibold text-gray-600 mt-8">
                        {voice.gender}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View className="p-5">
              <View className="w-52 h-52 rounded-full bg-indigo-500 items-center justify-center shadow-2xl">
                <Text className="text-white text-8xl font-semibold">
                  {VOICES[selectedVoiceIndex].avatar}
                </Text>
              </View>
            </View>
          )}

          <View className="items-center">
            <Text className="text-3xl font-semibold text-gray-900 mb-2">
              Vera Voice Assistant
            </Text>
            {isCallActive ? (
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <Text className="text-base text-green-500 font-medium">
                  {formatTime(callDuration)}
                </Text>
              </View>
            ) : (
              <Text className="text-base text-gray-400">Ready to listen</Text>
            )}
          </View>

          {isCallActive && (
            <View className="w-full bg-white rounded-2xl p-6 shadow-sm mt-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {conversationMode === 'listening'
                  ? 'Live Transcript'
                  : conversationMode === 'thinking'
                    ? 'Processing'
                    : 'Speaking'}
              </Text>
              <View className="min-h-[60px]">
                {conversationMode === 'listening' && isListening && !isMuted ? (
                  <Text className="text-base text-gray-900">
                    {transcript || (
                      <Text className="text-green-500 italic">
                        Listening...
                      </Text>
                    )}
                  </Text>
                ) : conversationMode === 'thinking' ? (
                  <Text className="text-base text-gray-900">
                    {transcript || (
                      <Text className="text-blue-500 italic">Thinking...</Text>
                    )}
                  </Text>
                ) : conversationMode === 'speaking' ? (
                  <Text className="text-base text-purple-500 italic">
                    Speaking...
                  </Text>
                ) : isMuted ? (
                  <Text className="text-base text-red-500 italic">
                    Microphone muted
                  </Text>
                ) : (
                  <Text className="text-base text-gray-400 italic">
                    Waiting for input...
                  </Text>
                )}
              </View>
            </View>
          )}

          <View className="flex-row gap-6 items-center">
            {isCallActive && (
              <>
                <TouchableOpacity
                  className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
                    isMuted ? 'bg-red-500' : 'bg-white'
                  }`}
                  onPress={handleMuteToggle}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={24}
                    color={isMuted ? 'white' : '#4b5563'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
                    conversationMode === 'thinking' ||
                    conversationMode === 'speaking'
                      ? 'bg-gray-300'
                      : isRecording
                        ? 'bg-red-500'
                        : 'bg-white'
                  }`}
                  onPress={handleRecordingToggle}
                  disabled={
                    conversationMode === 'thinking' ||
                    conversationMode === 'speaking'
                  }
                >
                  <Ionicons
                    name="radio-button-on"
                    size={24}
                    color={isRecording ? 'white' : '#4b5563'}
                  />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              className={`w-18 h-18 rounded-full items-center justify-center shadow-xl p-4 ${
                isCallActive ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              onPress={handleCallToggle}
            >
              <Ionicons
                name={isCallActive ? 'call' : 'call-outline'}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {!isCallActive && (
            <View className="w-full gap-4 mt-4">
              <View className="bg-white p-5 rounded-xl items-center gap-3 shadow-sm">
                <Ionicons name="mic" size={20} color="#6366f1" />
                <Text className="text-sm text-gray-600 text-center">
                  Natural voice conversation
                </Text>
              </View>
              <View className="bg-white p-5 rounded-xl items-center gap-3 shadow-sm">
                <Ionicons name="chatbubbles" size={20} color="#6366f1" />
                <Text className="text-sm text-gray-600 text-center">
                  Real-time support & guidance
                </Text>
              </View>
              <View className="bg-white p-5 rounded-xl items-center gap-3 shadow-sm">
                <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
                <Text className="text-sm text-gray-600 text-center">
                  Private & secure
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default VoiceAI
