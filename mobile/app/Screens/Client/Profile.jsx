import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native'
import { useSelector } from 'react-redux'
import { selectUser } from '../../store/slices/authSelectors'
import axiosInstance from '../../utils/axios.instance'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Switch from '../../components/Switch'
import TabGroup from '../../components/TabGroup'

const Profile = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    birthday: '',
    gender: '',
    avatar_url: '',
    permit_store: false,
    permit_analyze: false,
  })
  const [originalProfile, setOriginalProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [chatSessions, setChatSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [showSessionModal, setShowSessionModal] = useState(false)

  const getProfile = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/auth/fetch-profile')
      const { profile: fetchedProfile } = res.data
      const formattedProfile = {
        email: fetchedProfile.email || '',
        username: fetchedProfile.username || '',
        first_name: fetchedProfile.first_name || '',
        last_name: fetchedProfile.last_name || '',
        birthday: fetchedProfile.birthday || '',
        gender: fetchedProfile.gender || '',
        avatar_url: fetchedProfile.avatar_url || '',
        permit_store: fetchedProfile.permit_store || false,
        permit_analyze: fetchedProfile.permit_analyze || false,
      }
      setProfile(formattedProfile)
      setOriginalProfile(formattedProfile)
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const getChatSessions = async () => {
    try {
      setLoadingSessions(true)
      const res = await axiosInstance.get('/profile/fetch-sessions')
      const { chat_sessions } = res.data
      setChatSessions(chat_sessions)
      if (chat_sessions.length > 0) {
        setSelectedSession(chat_sessions[0])
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleInputChange = (name, value) => {
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setMessage({ type: '', text: '' })
  }

  const handleCancel = () => {
    setProfile(originalProfile)
    setIsEditMode(false)
    setMessage({ type: '', text: '' })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await axiosInstance.put('/auth/update-profile', {
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        birthday: profile.birthday,
        gender: profile.gender,
      })

      setOriginalProfile(profile)
      setIsEditMode(false)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    setIsEditingAvatar(true)
    setMessage({ type: '', text: '' })
  }

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please grant permission to access photos',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0])
    }
  }

  const handleImageUpload = async imageAsset => {
    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      })

      const res = await axiosInstance.put('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const updatedProfile = {
        ...profile,
        avatar_url: res.data.profile.avatar_url,
      }
      setProfile(updatedProfile)
      setOriginalProfile(updatedProfile)
      setIsEditingAvatar(false)
      setMessage({
        type: 'success',
        text: 'Profile picture updated successfully!',
      })

      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to upload profile picture' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCancelAvatar = () => {
    setIsEditingAvatar(false)
    setMessage({ type: '', text: '' })
  }

  const handlePermissionChange = async permissionType => {
    try {
      const updatedValue = !profile[permissionType]

      const res = await axiosInstance.post('/auth/update-permissions', {
        permit_store:
          permissionType === 'permit_store'
            ? updatedValue
            : profile.permit_store,
        permit_analyze:
          permissionType === 'permit_analyze'
            ? updatedValue
            : profile.permit_analyze,
      })
      const updatedProfile = {
        ...profile,
        [permissionType]: updatedValue,
      }
      setProfile(updatedProfile)
      setOriginalProfile(updatedProfile)

      setMessage({
        type: 'success',
        text: 'Privacy preferences updated successfully!',
      })

      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Failed to update privacy preferences',
      })
    }
  }

  useEffect(() => {
    getProfile()
    getChatSessions()
  }, [])

  const SkeletonLoader = () => (
    <View className="animate-pulse p-4">
      <View className="h-8 bg-gray-200 rounded-lg w-48 mb-6" />
      <View className="space-y-5">
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
        <View className="h-12 bg-gray-200 rounded-xl mb-3" />
      </View>
    </View>
  )

  if (loading) {
    return (
      <View className="flex-1 bg-gray-100 p-5">
        <View className="bg-white rounded-3xl p-10">
          <SkeletonLoader />
        </View>
      </View>
    )
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRiskColor = riskLevel => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return '#16a34a'
      case 'moderate':
        return '#f59e0b'
      case 'high':
        return '#dc2626'
      default:
        return '#9ca3af'
    }
  }

  const renderProfileTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-2xl font-bold text-indigo-500">
          Personal Information
        </Text>
        {!isEditMode && (
          <TouchableOpacity
            className="!px-6 !py-3 rounded-xl bg-indigo-500"
            onPress={handleEdit}
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {message.text && (
        <View
          className={`!px-5 !py-4 rounded-xl mb-6 ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-200'
              : 'bg-red-100 border border-red-200'
          }`}
        >
          <Text
            className={
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }
          >
            {message.text}
          </Text>
        </View>
      )}

      <View className="items-center !py-10 mb-8 bg-purple-50 rounded-2xl">
        <View className="relative mb-5">
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-36 h-36 rounded-full border-4 border-white"
            />
          ) : (
            <Ionicons name="person-circle" size={144} color="#d1d5db" />
          )}
        </View>

        {!isEditingAvatar ? (
          <TouchableOpacity
            className="!px-7 !py-3 rounded-xl border-2 border-indigo-500 bg-white mt-3"
            onPress={handleAvatarClick}
          >
            <Text className="text-indigo-500 font-semibold">
              Update Profile Picture
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              onPress={handleImagePicker}
              disabled={uploadingAvatar}
              className="!px-7 !py-3 rounded-xl bg-indigo-500 disabled:opacity-60"
            >
              <Text className="text-white font-semibold">
                {uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelAvatar}
              disabled={uploadingAvatar}
              className="!px-7 !py-3 rounded-xl bg-gray-100 disabled:opacity-60"
            >
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Email
          </Text>
          <TextInput
            value={profile.email}
            editable={false}
            className="!px-4 !py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500"
          />
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Username
          </Text>
          {isEditMode ? (
            <TextInput
              value={profile.username}
              onChangeText={value => handleInputChange('username', value)}
              placeholder="Username"
              className="!px-4 !py-4 rounded-xl border-2 border-gray-200"
            />
          ) : (
            <View className="!px-4 !py-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Text className="text-gray-900">
                {profile.username || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            First Name
          </Text>
          {isEditMode ? (
            <TextInput
              value={profile.first_name}
              onChangeText={value => handleInputChange('first_name', value)}
              placeholder="First Name"
              className="!px-4 !py-4 rounded-xl border-2 border-gray-200"
            />
          ) : (
            <View className="!px-4 !py-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Text className="text-gray-900">
                {profile.first_name || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Last Name
          </Text>
          {isEditMode ? (
            <TextInput
              value={profile.last_name}
              onChangeText={value => handleInputChange('last_name', value)}
              placeholder="Last Name"
              className="!px-4 !py-4 rounded-xl border-2 border-gray-200"
            />
          ) : (
            <View className="!px-4 !py-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Text className="text-gray-900">
                {profile.last_name || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Birthday
          </Text>
          {isEditMode ? (
            <TextInput
              value={profile.birthday}
              onChangeText={value => handleInputChange('birthday', value)}
              placeholder="YYYY-MM-DD"
              className="!px-4 !py-4 rounded-xl border-2 border-gray-200"
            />
          ) : (
            <View className="!px-4 !py-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Text className="text-gray-900">
                {profile.birthday || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">
            Gender
          </Text>
          {isEditMode ? (
            <TextInput
              value={profile.gender}
              onChangeText={value => handleInputChange('gender', value)}
              placeholder="Gender"
              className="!px-4 !py-4 rounded-xl border-2 border-gray-200"
            />
          ) : (
            <View className="!px-4 !py-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
              <Text className="text-gray-900">
                {profile.gender || 'Not set'}
              </Text>
            </View>
          )}
        </View>

        {isEditMode && (
          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              className="flex-1 !px-7 !py-4 rounded-xl bg-indigo-500 disabled:opacity-60"
              onPress={handleSave}
              disabled={saving}
            >
              <Text className="text-white font-semibold text-center">
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 !px-7 !py-4 rounded-xl bg-gray-100"
              onPress={handleCancel}
            >
              <Text className="text-gray-600 font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  )

  const renderPrivacyTab = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {message.text && (
        <View
          className={`!px-5 !py-4 rounded-xl mb-6 ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-200'
              : 'bg-red-100 border border-red-200'
          }`}
        >
          <Text
            className={
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }
          >
            {message.text}
          </Text>
        </View>
      )}

      <Text className="text-2xl font-bold text-gray-900 mb-6">
        Privacy & Consent
      </Text>

      <View className="space-y-5">
        <View className="flex-row justify-between items-start p-7 bg-gray-50 border-2 border-gray-200 rounded-2xl">
          <View className="flex-1 pr-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Store Conversations
            </Text>
            <Text className="text-sm text-gray-600">
              Allow V.E.R.A. to store your conversations with the AI
              (chat/voice). This data will only be accessible to our staff and
              licensed doctors to help them better understand your situation and
              provide more personalized support and care.
            </Text>
          </View>
          <Switch
            id="permit_store"
            checked={profile.permit_store}
            onChange={() => handlePermissionChange('permit_store')}
          />
        </View>

        <View className="flex-row justify-between items-start p-7 bg-gray-50 border-2 border-gray-200 rounded-2xl mt-5">
          <View className="flex-1 pr-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              AI Analysis of Conversations
            </Text>
            <Text className="text-sm text-gray-600">
              Consent to V.E.R.A. using AI to analyze your conversations for
              patterns in emotional state, mental well-being, and potential risk
              indicators. This analysis helps provide early detection of
              emotional distress, generate personalized recommendations, and
              improve the quality of support you receive through predictive
              analytics and mood tracking.
            </Text>
          </View>
          <Switch
            id="permit_analyze"
            checked={profile.permit_analyze}
            onChange={() => handlePermissionChange('permit_analyze')}
          />
        </View>
      </View>
    </ScrollView>
  )

  const renderSessionsTab = () => (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loadingSessions ? (
          <View className="items-center !py-16 !px-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-gray-500 mt-4">Loading sessions...</Text>
          </View>
        ) : chatSessions.length === 0 ? (
          <View className="items-center !py-16 !px-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Text className="text-gray-500">No chat sessions found</Text>
          </View>
        ) : selectedSession ? (
          <View className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-7">
            <View className="flex-row justify-between items-center mb-5 pb-5 border-b-2 border-gray-200">
              <Text className="text-xl font-bold text-gray-900">
                Session Details
              </Text>
              <View className="flex-row gap-2">
                <View
                  className={`!px-3 !py-2 rounded-lg ${
                    selectedSession.type === 'text'
                      ? 'bg-blue-200'
                      : 'bg-pink-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold uppercase ${
                      selectedSession.type === 'text'
                        ? 'text-blue-800'
                        : 'text-pink-800'
                    }`}
                  >
                    {selectedSession.type}
                  </Text>
                </View>
                {selectedSession.risk_level && (
                  <View
                    className="!px-3 !py-2 rounded-lg"
                    style={{
                      backgroundColor: getRiskColor(selectedSession.risk_level),
                    }}
                  >
                    <Text className="text-xs font-bold capitalize text-white">
                      {selectedSession.risk_level}
                      {selectedSession.risk_score
                        ? ` (${selectedSession.risk_score})`
                        : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="space-y-4">
              <Text className="text-sm text-gray-700">
                <Text className="font-bold">Date:</Text>{' '}
                {formatDate(selectedSession.created_at)}
              </Text>
              {selectedSession.summary && (
                <Text className="text-sm text-gray-700">
                  <Text className="font-bold">Summary:</Text>{' '}
                  {selectedSession.summary}
                </Text>
              )}
            </View>

            <View className="mt-6">
              <Text className="text-lg font-bold text-gray-900 mb-5">
                Conversation
              </Text>
              {selectedSession.chat_messages.length === 0 ? (
                <View className="items-center !py-16 !px-10 bg-gray-100 rounded-xl">
                  <Text className="text-gray-500 italic">
                    No messages in this session
                  </Text>
                </View>
              ) : (
                <View>
                  {selectedSession.chat_messages.map(message => (
                    <View
                      key={message.id}
                      className={`!px-5 !py-5 rounded-2xl mb-4 ${
                        message.sent_by === 'user'
                          ? 'bg-indigo-500 self-end'
                          : 'bg-gray-200 self-start'
                      }`}
                      style={{
                        maxWidth: '80%',
                        alignSelf:
                          message.sent_by === 'user'
                            ? 'flex-end'
                            : 'flex-start',
                      }}
                    >
                      <Text
                        className={`text-xs font-bold mb-2 uppercase ${
                          message.sent_by === 'user'
                            ? 'text-white'
                            : 'text-indigo-500'
                        }`}
                      >
                        {message.sent_by === 'user' ? 'You' : 'Sentinel'}
                      </Text>
                      <Text
                        className={`text-sm mb-2 ${
                          message.sent_by === 'user'
                            ? 'text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {message.content || '(No content)'}
                      </Text>
                      <Text
                        className={`text-xs text-right ${
                          message.sent_by === 'user'
                            ? 'text-white opacity-70'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatDate(message.created_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="items-center !py-16 !px-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Text className="text-gray-500">
              Select a session to view details
            </Text>
          </View>
        )}
      </ScrollView>

      {!loadingSessions && chatSessions.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-indigo-500 items-center justify-center shadow-lg"
          onPress={() => setShowSessionModal(true)}
        >
          <Ionicons name="list" size={28} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        visible={showSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            <View className="flex-row justify-between items-center p-6 border-b-2 border-gray-200">
              <Text className="text-xl font-bold text-gray-900">
                Select Session
              </Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {chatSessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  className={`p-5 rounded-2xl border-2 mb-4 ${
                    selectedSession?.id === session.id
                      ? 'border-indigo-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onPress={() => {
                    setSelectedSession(session)
                    setShowSessionModal(false)
                  }}
                >
                  <View className="flex-row gap-2 mb-2 flex-wrap">
                    <View
                      className={`!px-3 !py-1 rounded-lg ${
                        session.type === 'text' ? 'bg-blue-200' : 'bg-pink-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase ${
                          session.type === 'text'
                            ? 'text-blue-800'
                            : 'text-pink-800'
                        }`}
                      >
                        {session.type}
                      </Text>
                    </View>
                    {session.risk_level && (
                      <View
                        className="!px-3 !py-1 rounded-lg"
                        style={{
                          backgroundColor: getRiskColor(session.risk_level),
                        }}
                      >
                        <Text className="text-xs font-bold capitalize text-white">
                          {session.risk_level}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-500 font-medium mb-3">
                    {formatDate(session.created_at)}
                  </Text>
                  {session.summary && (
                    <Text className="text-sm text-gray-700">
                      {session.summary.substring(0, 60)}
                      {session.summary.length > 60 ? '...' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )

  return (
    <View className="flex-1 mt-10 bg-gray-100">
      <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
        <TabGroup
          tabs={[
            { label: 'Profile', value: 'profile' },
            { label: 'Privacy', value: 'privacy' },
            { label: 'Sessions', value: 'sessions' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <View className="flex-1 p-5">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'sessions' && renderSessionsTab()}
        </View>

        {/* Logout Button */}
        <View className="p-5">
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="bg-red-500 p-4 rounded-xl flex-row items-center justify-center gap-3 shadow-sm active:bg-red-600"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default Profile
