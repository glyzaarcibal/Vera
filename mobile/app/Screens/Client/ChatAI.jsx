import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import axiosInstance from '../../utils/axios.instance'

const ChatAI = () => {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! I'm here to listen and support you. How are you feeling today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef(null)

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const initializeSession = async () => {
    try {
      const res = await axiosInstance.post('/sessions/start-session/text')
      const { session } = res.data
      setSessionId(session.id)
      return session
    } catch (e) {
      alert(e.response?.data?.message || 'Internal Server Error')
    }
  }

  const fetchBotResponse = async (tempId, message) => {
    try {
      const res = await axiosInstance.post(
        `/messages/process-message/${tempId}`,
        { message, messages },
      )
      const { response } = res.data
      return response
    } catch (e) {
      alert('Internal Server Error')
    }
  }

  const handleSend = async () => {
    if (inputValue.trim() === '') return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setInputValue('')
    setIsTyping(true)

    if (sessionId === null) {
      const sessionData = await initializeSession()
      const botResponse = await fetchBotResponse(sessionData.id, newMessage)
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    } else {
      const botResponse = await fetchBotResponse(sessionId, newMessage)
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }
  }

  const formatTime = timestamp => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View className="flex-1">
        <View className="p-6 bg-gray-50 border-b border-gray-200">
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center">
              <Text className="text-white text-xl font-semibold">V</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                Vera Assistant
              </Text>
              <View className="flex-row items-center gap-3 mt-1">
                <View className="flex-row items-center gap-1">
                  <View className="w-2 h-2 rounded-full bg-green-500" />
                  <Text className="text-xs text-green-600">Online</Text>
                </View>
                {sessionId && (
                  <View className="px-3 py-1 bg-gray-200 rounded-full">
                    <Text className="text-xs text-gray-600 font-mono">
                      Session: {sessionId}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-6 bg-white"
          showsVerticalScrollIndicator={false}
        >
          {messages.map(message => (
            <View
              key={message.id}
              className={`mb-4 ${
                message.type === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <View
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-indigo-500 rounded-br'
                    : 'bg-gray-100 rounded-bl'
                }`}
              >
                <Text
                  className={`text-sm leading-6 ${
                    message.type === 'user' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {message.text}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    message.type === 'user'
                      ? 'text-white opacity-70'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View className="mb-4 items-start">
              <View className="px-4 py-4 bg-gray-100 rounded-2xl rounded-bl">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
                  <View className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="p-6 bg-gray-50 border-t border-gray-200">
          <View className="flex-row items-end gap-3">
            <TextInput
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-3xl text-sm"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Share what's on your mind..."
              placeholderTextColor="#9ca3af"
              multiline
              maxHeight={120}
            />
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-indigo-500 items-center justify-center disabled:opacity-50"
              onPress={handleSend}
              disabled={inputValue.trim() === '' || isTyping}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default ChatAI
