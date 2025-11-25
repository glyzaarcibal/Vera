import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import axiosInstance from '../utils/axios.instance'
import RiskBadge from '../components/RiskBadge'

const UserChat = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { sessionId, userId } = route.params

  const [loading, setLoading] = useState(true)
  const [chat, setChat] = useState([])
  const [sessionInfo, setSessionInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [selectedEmotion, setSelectedEmotion] = useState(null)

  // Doctor notes state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [problemCategory, setProblemCategory] = useState('')
  const [severityRating, setSeverityRating] = useState(null)
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const emotionColors = {
    sad: '#3B82F6',
    angry: '#EF4444',
    happy: '#FBBF24',
    disgust: '#10B981',
    fearful: '#8B5CF6',
    neutral: '#9CA3AF',
    surprised: '#F97316',
  }

  useEffect(() => {
    getChatInfo()
  }, [])

  const getChatInfo = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get(`/sessions/fetch-chat/${sessionId}`)
      const { chat, sessionInfo } = res.data
      setChat(chat)
      setSessionInfo(sessionInfo)
    } catch (e) {
      alert(e.response?.data?.message || 'Internal Server Error')
    } finally {
      setLoading(false)
    }
  }

  const getDominantEmotion = emotionData => {
    if (!emotionData || emotionData.length === 0) return null
    const emotions = emotionData[0]
    const emotionList = [
      { name: 'sad', value: emotions.sad },
      { name: 'angry', value: emotions.angry },
      { name: 'happy', value: emotions.happy },
      { name: 'disgust', value: emotions.disgust },
      { name: 'fearful', value: emotions.fearful },
      { name: 'neutral', value: emotions.neutral },
      { name: 'surprised', value: emotions.surprised },
    ]
    return emotionList.reduce((max, emotion) =>
      emotion.value > max.value ? emotion : max,
    )
  }

  const calculateOverallEmotions = () => {
    const messagesWithEmotions = chat.filter(
      msg => msg.message_emotion && msg.message_emotion.length > 0,
    )
    if (messagesWithEmotions.length === 0) return null

    const totals = {
      sad: 0,
      angry: 0,
      happy: 0,
      disgust: 0,
      fearful: 0,
      neutral: 0,
      surprised: 0,
    }

    messagesWithEmotions.forEach(msg => {
      const emotion = msg.message_emotion[0]
      Object.keys(totals).forEach(key => {
        totals[key] += emotion[key] || 0
      })
    })

    const count = messagesWithEmotions.length
    return Object.keys(totals).map(key => ({
      emotion: key.charAt(0).toUpperCase() + key.slice(1),
      value: (totals[key] / count) * 100,
      color: emotionColors[key],
    }))
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = dateString => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const saveDoctorNotes = async () => {
    if (!problemCategory) {
      alert('Please select a problem category')
      return
    }
    if (!severityRating) {
      alert('Please select a severity rating')
      return
    }
    if (!doctorNotes.trim()) {
      alert('Please enter clinical observations')
      return
    }
    if (!treatmentPlan.trim()) {
      alert('Please enter a treatment plan')
      return
    }

    try {
      setSavingNotes(true)
      const payload = {
        session_id: sessionId,
        doctor_id: null,
        problem_category: problemCategory,
        severity_rating: severityRating,
        clinical_observations: doctorNotes,
        treatment_plan: treatmentPlan,
        next_appointment: nextAppointment || null,
      }

      await axiosInstance.post('/doctor/save-note', payload)
      alert("Doctor's notes saved successfully")
      setProblemCategory('')
      setSeverityRating(null)
      setDoctorNotes('')
      setTreatmentPlan('')
      setNextAppointment('')
      setShowCreateForm(false)
      await getChatInfo()
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save doctor's notes")
    } finally {
      setSavingNotes(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-5 py-6">
          {/* Back Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            className="flex-row items-center gap-2 bg-white rounded-lg px-4 py-3 mb-5 shadow-sm active:opacity-70"
          >
            <Ionicons name="arrow-back" size={20} color="#6366f1" />
            <Text className="text-indigo-500 text-base font-semibold">
              Back to Sessions
            </Text>
          </Pressable>

          {/* Chat Messages */}
          <View className="bg-white rounded-xl shadow-sm p-5 mb-5">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Chat Session
            </Text>
            <Text className="text-sm text-gray-500 mb-5">
              Session ID: {sessionId}
            </Text>

            {chat.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-gray-400">
                  No messages in this session
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {chat.map(message => {
                  const hasEmotion =
                    message.message_emotion &&
                    message.message_emotion.length > 0
                  const dominantEmotion = hasEmotion
                    ? getDominantEmotion(message.message_emotion)
                    : null

                  return (
                    <View
                      key={message.id}
                      className={`flex-row gap-3 ${
                        message.sent_by === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          message.sent_by === 'user'
                            ? 'bg-indigo-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Ionicons
                          name={
                            message.sent_by === 'user' ? 'person' : 'chatbot'
                          }
                          size={20}
                          color={
                            message.sent_by === 'user' ? '#6366f1' : '#6b7280'
                          }
                        />
                      </View>

                      {/* Message Content */}
                      <View className="flex-1">
                        <View
                          className={`flex-row items-center gap-2 mb-1 ${
                            message.sent_by === 'user'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold uppercase ${
                              message.sent_by === 'user'
                                ? 'text-indigo-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {message.sent_by === 'user' ? 'User' : 'Sentinel'}
                          </Text>
                          <Text className="text-xs text-gray-400">
                            {formatTime(message.created_at)}
                          </Text>
                          {hasEmotion && (
                            <Pressable
                              onPress={() =>
                                setSelectedEmotion(
                                  selectedEmotion === message.id
                                    ? null
                                    : message.id,
                                )
                              }
                              className="px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: `${
                                  emotionColors[dominantEmotion.name]
                                }30`,
                              }}
                            >
                              <Text
                                className="text-xs font-semibold capitalize"
                                style={{
                                  color: emotionColors[dominantEmotion.name],
                                }}
                              >
                                {dominantEmotion.name}
                              </Text>
                            </Pressable>
                          )}
                        </View>

                        <View
                          className={`px-4 py-3 rounded-lg ${
                            message.sent_by === 'user'
                              ? 'bg-indigo-500'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              message.sent_by === 'user'
                                ? 'text-white'
                                : 'text-gray-800'
                            }`}
                          >
                            {message.content || '(No content)'}
                          </Text>
                        </View>

                        {/* Emotion Analysis (Expandable) */}
                        {hasEmotion && selectedEmotion === message.id && (
                          <View className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                            <Text className="text-xs font-semibold text-gray-800 mb-3 uppercase">
                              Emotion Analysis
                            </Text>
                            <View className="gap-2">
                              {Object.entries(message.message_emotion[0])
                                .filter(
                                  ([key]) =>
                                    ![
                                      'id',
                                      'model',
                                      'created_at',
                                      'message_id',
                                    ].includes(key),
                                )
                                .sort((a, b) => b[1] - a[1])
                                .map(([emotion, value]) => (
                                  <View
                                    key={emotion}
                                    className="flex-row items-center justify-between"
                                  >
                                    <View className="flex-row items-center gap-2">
                                      <View
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor:
                                            emotionColors[emotion],
                                        }}
                                      />
                                      <Text className="text-xs font-medium text-gray-700 capitalize">
                                        {emotion}
                                      </Text>
                                    </View>
                                    <Text className="text-xs font-bold text-gray-800">
                                      {(value * 100).toFixed(2)}%
                                    </Text>
                                  </View>
                                ))}
                            </View>
                            <View className="mt-3 pt-3 border-t border-gray-200">
                              <Text className="text-xs text-gray-500">
                                Model: {message.message_emotion[0].model}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* Tabbed Panel - Session Info & Doctor's Notes */}
          <View className="bg-white rounded-xl shadow-sm mb-5 overflow-hidden">
            {/* Tabs */}
            <View className="flex-row border-b border-gray-100">
              <Pressable
                onPress={() => setActiveTab('info')}
                className={`flex-1 py-4 px-5 items-center ${
                  activeTab === 'info' ? 'border-b-2 border-indigo-600' : ''
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === 'info' ? 'text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  Session Info
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab('notes')}
                className={`flex-1 py-4 px-5 items-center ${
                  activeTab === 'notes' ? 'border-b-2 border-indigo-600' : ''
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === 'notes' ? 'text-indigo-600' : 'text-gray-500'
                  }`}
                >
                  Doctor's Notes
                </Text>
              </Pressable>
            </View>

            {/* Tab Content */}
            <View className="p-5">
              {activeTab === 'info' && sessionInfo ? (
                <View className="gap-5">
                  {/* Risk Assessment */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                      Risk Assessment
                    </Text>
                    <View className="bg-gray-50 rounded-lg p-4 gap-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-gray-600 font-medium">
                          Risk Level
                        </Text>
                        <RiskBadge level={sessionInfo.risk_level} />
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-gray-600 font-medium">
                          Risk Score
                        </Text>
                        <Text className="text-2xl font-bold text-gray-800">
                          {sessionInfo.risk_score}
                          <Text className="text-sm text-gray-400">/100</Text>
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Session Details */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                      Session Details
                    </Text>
                    <View className="gap-3">
                      <View className="flex-row gap-2">
                        <Text className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Type:
                        </Text>
                        <Text className="text-xs text-gray-800 bg-indigo-50 px-2 py-1 rounded uppercase font-semibold">
                          {sessionInfo.session_type}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <Text className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Created:
                        </Text>
                        <Text className="text-xs text-gray-800">
                          {formatDate(sessionInfo.created_at)}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <Text className="text-xs text-gray-600 font-medium min-w-[80px]">
                          Messages:
                        </Text>
                        <Text className="text-xs text-gray-800 font-semibold">
                          {chat.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* AI Summary */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                      AI Summary
                    </Text>
                    <View className="bg-gray-50 rounded-lg p-4">
                      <Text className="text-sm text-gray-700 leading-relaxed">
                        {sessionInfo.summary || 'No summary available'}
                      </Text>
                    </View>
                  </View>

                  {/* Emotion Analytics */}
                  {calculateOverallEmotions() && (
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                        Emotion Analytics
                      </Text>
                      <View className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <Text className="text-xs text-purple-800 font-medium mb-4">
                          Overall emotion distribution across{' '}
                          {
                            chat.filter(
                              msg =>
                                msg.message_emotion &&
                                msg.message_emotion.length > 0,
                            ).length
                          }{' '}
                          analyzed messages
                        </Text>
                        <View className="gap-2">
                          {calculateOverallEmotions()
                            .sort((a, b) => b.value - a.value)
                            .map(item => (
                              <View
                                key={item.emotion}
                                className="flex-row items-center justify-between bg-white bg-opacity-60 rounded px-3 py-2"
                              >
                                <View className="flex-row items-center gap-2">
                                  <View
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <Text className="text-xs font-medium text-gray-700">
                                    {item.emotion}
                                  </Text>
                                </View>
                                <Text className="text-xs font-bold text-gray-800">
                                  {item.value.toFixed(2)}%
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Clinical Analysis */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                      Clinical Analysis
                    </Text>
                    <View className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <View className="gap-3">
                        <View>
                          <Text className="text-xs font-semibold text-amber-800 mb-2">
                            Key Indicators
                          </Text>
                          <View className="gap-1">
                            {sessionInfo.risk_level === 'high' ||
                            sessionInfo.risk_level === 'critical' ? (
                              <>
                                <Text className="text-xs text-amber-900">
                                  • Elevated distress signals detected
                                </Text>
                                <Text className="text-xs text-amber-900">
                                  • Potential emotional overwhelm
                                </Text>
                                <Text className="text-xs text-amber-900">
                                  • Communication pattern anomalies
                                </Text>
                              </>
                            ) : (
                              <>
                                <Text className="text-xs text-amber-900">
                                  • Normal communication patterns
                                </Text>
                                <Text className="text-xs text-amber-900">
                                  • Stable emotional indicators
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        <View>
                          <Text className="text-xs font-semibold text-amber-800 mb-2">
                            Recommended Action
                          </Text>
                          <Text className="text-xs text-amber-900">
                            {sessionInfo.risk_score >= 70
                              ? 'Immediate follow-up recommended. Consider direct intervention.'
                              : sessionInfo.risk_score >= 50
                                ? 'Schedule follow-up within 48 hours. Monitor closely.'
                                : 'Continue routine monitoring. No immediate action required.'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ) : activeTab === 'notes' ? (
                showCreateForm ? (
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-gray-800 uppercase">
                        New Doctor's Note
                      </Text>
                      <Pressable
                        onPress={() => setShowCreateForm(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <Ionicons name="close" size={20} color="#6b7280" />
                      </Pressable>
                    </View>

                    {/* Problem Category */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-2 uppercase">
                        Problem Categorization
                      </Text>
                      <View className="border border-gray-300 rounded-lg">
                        <Pressable
                          onPress={() => {
                            /* Open picker */
                          }}
                          className="px-4 py-3"
                        >
                          <Text
                            className={`text-sm ${
                              problemCategory
                                ? 'text-gray-800'
                                : 'text-gray-400'
                            }`}
                          >
                            {problemCategory ||
                              'Select category (Anxiety, Depression, etc.)'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Severity Rating */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-2 uppercase">
                        Severity Rating
                      </Text>
                      <View className="flex-row gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <Pressable
                            key={rating}
                            onPress={() => setSeverityRating(rating)}
                            className={`flex-1 py-3 border-2 rounded-lg items-center ${
                              severityRating === rating
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-gray-300'
                            }`}
                          >
                            <Text
                              className={`text-sm font-semibold ${
                                severityRating === rating
                                  ? 'text-white'
                                  : 'text-gray-800'
                              }`}
                            >
                              {rating}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        1 = Minimal, 5 = Severe
                      </Text>
                    </View>

                    {/* Clinical Observations */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-2 uppercase">
                        Clinical Observations
                      </Text>
                      <TextInput
                        className="px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        multiline
                        numberOfLines={6}
                        placeholder="Document your observations, behavioral patterns, and clinical impressions..."
                        value={doctorNotes}
                        onChangeText={setDoctorNotes}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Treatment Plan */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-2 uppercase">
                        Treatment Plan
                      </Text>
                      <TextInput
                        className="px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        multiline
                        numberOfLines={4}
                        placeholder="Outline recommended interventions, therapy approach, and follow-up actions..."
                        value={treatmentPlan}
                        onChangeText={setTreatmentPlan}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Next Appointment */}
                    <View>
                      <Text className="text-sm font-semibold text-gray-800 mb-2 uppercase">
                        Next Appointment
                      </Text>
                      <TextInput
                        className="px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        placeholder="YYYY-MM-DD HH:MM"
                        value={nextAppointment}
                        onChangeText={setNextAppointment}
                      />
                    </View>

                    {/* Save Button */}
                    <Pressable
                      onPress={saveDoctorNotes}
                      disabled={savingNotes}
                      className={`py-3 rounded-lg items-center ${
                        savingNotes ? 'bg-gray-400' : 'bg-indigo-500'
                      }`}
                    >
                      <Text className="text-white font-semibold">
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-gray-800 uppercase">
                        Doctor's Notes
                      </Text>
                      <Pressable
                        onPress={() => setShowCreateForm(true)}
                        className="p-2 bg-indigo-500 rounded-lg active:opacity-70"
                      >
                        <Ionicons name="add" size={20} color="white" />
                      </Pressable>
                    </View>

                    {!sessionInfo?.doctor_notes ||
                    sessionInfo.doctor_notes.length === 0 ? (
                      <View className="py-12 items-center">
                        <Text className="text-gray-400 mb-4">
                          No doctor's notes yet
                        </Text>
                        <Pressable
                          onPress={() => setShowCreateForm(true)}
                          className="px-4 py-2 bg-indigo-500 rounded-lg active:opacity-70"
                        >
                          <Text className="text-white text-sm font-semibold">
                            Add First Note
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        {sessionInfo.doctor_notes.map(note => (
                          <View
                            key={note.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 gap-3"
                          >
                            <View className="flex-row items-start justify-between">
                              <View>
                                <Text className="text-sm font-semibold text-gray-800">
                                  Dr. {note.profiles?.first_name || ''}{' '}
                                  {note.profiles?.last_name || 'Unknown'}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-1">
                                  {formatDate(note.created_at)}
                                </Text>
                              </View>
                              <View className="px-3 py-1 bg-indigo-100 rounded-full">
                                <Text className="text-xs font-semibold text-indigo-700 uppercase">
                                  {note.problem_category}
                                </Text>
                              </View>
                            </View>

                            <View className="flex-row items-center gap-2">
                              <Text className="text-xs text-gray-600 font-medium">
                                Severity:
                              </Text>
                              <View className="flex-row gap-1">
                                {[1, 2, 3, 4, 5].map(level => (
                                  <View
                                    key={level}
                                    className={`w-6 h-6 rounded items-center justify-center ${
                                      level <= note.severity_rating
                                        ? level <= 2
                                          ? 'bg-green-500'
                                          : level <= 3
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        : 'bg-gray-200'
                                    }`}
                                  >
                                    <Text
                                      className={`text-xs font-bold ${
                                        level <= note.severity_rating
                                          ? 'text-white'
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {level}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>

                            <View>
                              <Text className="text-xs font-semibold text-gray-700 mb-1 uppercase">
                                Clinical Observations
                              </Text>
                              <Text className="text-sm text-gray-600 leading-relaxed">
                                {note.clinical_observations}
                              </Text>
                            </View>

                            <View>
                              <Text className="text-xs font-semibold text-gray-700 mb-1 uppercase">
                                Treatment Plan
                              </Text>
                              <Text className="text-sm text-gray-600 leading-relaxed">
                                {note.treatment_plan}
                              </Text>
                            </View>

                            {note.next_appointment && (
                              <View className="pt-3 border-t border-gray-200">
                                <View className="flex-row items-center gap-2">
                                  <Ionicons
                                    name="calendar-outline"
                                    size={14}
                                    color="#6366f1"
                                  />
                                  <Text className="text-xs text-gray-600 font-medium">
                                    Next Appointment:
                                  </Text>
                                  <Text className="text-xs font-semibold text-gray-800">
                                    {formatDate(note.next_appointment)}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        ))}

                        <Pressable
                          onPress={() => setShowCreateForm(true)}
                          className="py-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 items-center active:opacity-70"
                        >
                          <Text className="text-gray-700 font-semibold">
                            + Add New Note
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default UserChat
