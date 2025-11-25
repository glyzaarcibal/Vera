import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

import axiosInstance from '../../utils/axios.instance'
import DailyMoodModal from '../../components/DailyMoodModal'
import { useSelector } from 'react-redux'
import { selectUser } from '../../store/slices/authSelectors'

const Home = ({ navigation }) => {
  const user = useSelector(selectUser)
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [resources, setResources] = useState([])
  const [assignedResources, setAssignedResources] = useState([])
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await retrieveDailyMoods()
    await fetchResources()
    await fetchAssignedResources()
    setLoading(false)
  }

  const retrieveDailyMoods = async () => {
    try {
      const res = await axiosInstance.get('/moods/retrieve-daily-moods')
      console.log(res.data)

      // Show modal if no mood recorded for today
      if (res.data.moods && res.data.moods.length === 0) {
        setShowMoodModal(true)
      }
    } catch (e) {
      alert(e.response.data.message || 'Internal Server Error')
    }
  }

  const handleSaveMood = async moodScore => {
    try {
      await axiosInstance.post('/moods/save-daily-mood', {
        mood_score: moodScore,
      })
      setShowMoodModal(false)
      // Refresh the moods data after saving
      retrieveDailyMoods()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save mood')
    }
  }

  const fetchResources = async () => {
    try {
      const res = await axiosInstance.get('/resources')
      setResources(res.data.resources || res.data || [])
    } catch (e) {
      console.error('Error fetching resources:', e)
    }
  }
  useEffect(() => {
    fetchAssignedResources()
  }, [user])
  const fetchAssignedResources = async () => {
    if (user === undefined) return
    console.log(user)
    try {
      // Note: You'll need to get the actual user ID from your auth context/redux store
      // For now using a placeholder - replace with actual user.id
      const res = await axiosInstance.get(
        `/resources/get-assignments/${user.id}`,
      )
      const assignments = res.data.assignments || []
      setAssignedResources(assignments)

      // Map assignments to full resource details
      const resourcesRes = await axiosInstance.get('/resources')
      const allResources = resourcesRes.data.resources || []
      const details = assignments
        .map(assignment =>
          allResources.find(r => r.id === assignment.resource_id),
        )
        .filter(Boolean)
      setAssignedResourceDetails(details)
    } catch (e) {
      console.error('Error fetching assigned resources:', e)
    }
  }

  const extractDomain = url => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const featuredResource = resources[0]
  const otherResources = resources.slice(1, 7) // Show up to 6 more resources

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="max-w-[1200px] mx-auto px-5 py-10">
        {/* Hero Section */}
        <View className="items-center mb-20">
          <View className="px-5 py-2 bg-purple-50 border border-purple-100 rounded-full mb-6">
            <Text className="text-indigo-500 text-sm font-semibold tracking-wide">
              Mental Health Support
            </Text>
          </View>

          <Text className="text-5xl font-bold text-gray-900 text-center mb-4 px-4">
            Welcome to <Text className="text-indigo-500">V.E.R.A.</Text>
          </Text>

          <Text className="text-xl text-gray-600 font-medium text-center mb-6 px-4">
            Voice Emotion Recognition Application
          </Text>

          <Text className="text-base text-gray-600 text-center max-w-[600px] mx-auto mb-10 leading-6 px-4">
            Your AI-powered companion for mental well-being, offering support
            through voice recognition, predictive analytics, and emotional
            tracking.
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-4 justify-center items-center px-4 w-full">
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className="flex-1 max-w-[200px]"
            >
              <Text className="text-white text-base font-semibold text-center">
                Get Started
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              className="px-8 py-3.5 bg-white border-2 border-indigo-500 rounded-xl flex-1 max-w-[200px]"
            >
              <Text className="text-indigo-500 text-base font-semibold text-center">
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <View className="gap-6 mb-20 px-4">
          {/* Feature Card 1 */}
          <View className="bg-white p-8 rounded-2xl shadow-sm">
            <View className="w-14 h-14 bg-purple-50 rounded-xl items-center justify-center mb-5">
              <Ionicons name="mic" size={24} color="#667eea" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Voice Emotion Recognition
            </Text>
            <Text className="text-[15px] text-gray-600 leading-6">
              Express yourself naturally and let our AI understand your
              emotional state through voice analysis.
            </Text>
          </View>

          {/* Feature Card 2 */}
          <View className="bg-white p-8 rounded-2xl shadow-sm">
            <View className="w-14 h-14 bg-purple-50 rounded-xl items-center justify-center mb-5">
              <Ionicons name="chatbubbles" size={24} color="#667eea" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              AI Chatbot Support
            </Text>
            <Text className="text-[15px] text-gray-600 leading-6">
              Get immediate emotional support and mental health first aid when
              you need it most.
            </Text>
          </View>

          {/* Feature Card 3 */}
          <View className="bg-white p-8 rounded-2xl shadow-sm">
            <View className="w-14 h-14 bg-purple-50 rounded-xl items-center justify-center mb-5">
              <Ionicons name="bar-chart" size={24} color="#667eea" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Mood Tracking
            </Text>
            <Text className="text-[15px] text-gray-600 leading-6">
              Monitor your emotional patterns and gain valuable insights into
              your mental wellness journey.
            </Text>
          </View>

          {/* Feature Card 4 */}
          <View className="bg-white p-8 rounded-2xl shadow-sm">
            <View className="w-14 h-14 bg-purple-50 rounded-xl items-center justify-center mb-5">
              <Ionicons name="analytics" size={24} color="#667eea" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Predictive Analytics
            </Text>
            <Text className="text-[15px] text-gray-600 leading-6">
              Early detection of emotional distress patterns to provide timely
              assistance and intervention.
            </Text>
          </View>
        </View>

        {/* Helpful Resources Section */}
        {!loading && resources.length > 0 && (
          <View className="mb-16 px-4">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Helpful Resources
              </Text>
              <Text className="text-base text-gray-600 text-center max-w-[500px]">
                Explore curated content and tools to support your mental
                wellness journey
              </Text>
            </View>

            {/* Featured Resource */}
            {featuredResource && (
              <View className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                {featuredResource.image_url ? (
                  <View className="h-64">
                    <Image
                      source={{ uri: featuredResource.image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
                    <Ionicons name="book" size={96} color="white" />
                  </View>
                )}
                <View className="p-6">
                  {featuredResource.category && (
                    <View className="px-3 py-1 bg-blue-100 rounded-full mb-4 self-start">
                      <Text className="text-xs font-semibold text-blue-700">
                        {featuredResource.category}
                      </Text>
                    </View>
                  )}
                  <Text className="text-2xl font-bold text-gray-900 mb-3">
                    {featuredResource.title}
                  </Text>
                  <Text className="text-gray-600 mb-6" numberOfLines={3}>
                    {featuredResource.description}
                  </Text>
                  {featuredResource.links &&
                    featuredResource.links.length > 0 && (
                      <View>
                        <Text className="text-sm font-medium text-gray-700 mb-3">
                          Resources:
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          {featuredResource.links.map((link, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                /* Open link */
                              }}
                              className="flex-row items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <Ionicons name="link" size={16} color="#1e40af" />
                              <Text className="text-sm font-medium text-blue-700 ml-2">
                                {extractDomain(link)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Other Resources Grid */}
            {otherResources.length > 0 && (
              <View className="gap-6">
                {otherResources.map(resource => (
                  <View
                    key={resource.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    {resource.image_url ? (
                      <View className="h-48">
                        <Image
                          source={{ uri: resource.image_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 items-center justify-center">
                        <Ionicons name="book" size={64} color="white" />
                      </View>
                    )}
                    <View className="p-6">
                      {resource.category && (
                        <View className="px-2 py-1 bg-blue-100 rounded-full mb-3 self-start">
                          <Text className="text-xs font-semibold text-blue-700">
                            {resource.category}
                          </Text>
                        </View>
                      )}
                      <Text className="text-lg font-bold text-gray-900 mb-2">
                        {resource.title}
                      </Text>
                      <Text
                        className="text-gray-600 text-sm mb-4"
                        numberOfLines={2}
                      >
                        {resource.description}
                      </Text>
                      {resource.links && resource.links.length > 0 && (
                        <View>
                          <Text className="text-xs font-medium text-gray-600 mb-2">
                            Links:
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {resource.links.slice(0, 2).map((link, index) => (
                              <TouchableOpacity
                                key={index}
                                onPress={() => {
                                  /* Open link */
                                }}
                                className="flex-row items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded"
                              >
                                <Ionicons
                                  name="link"
                                  size={12}
                                  color="#1e40af"
                                />
                                <Text className="text-xs font-medium text-blue-700 ml-1">
                                  {extractDomain(link)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            {resource.links.length > 2 && (
                              <Text className="text-xs text-gray-500 px-2 py-1">
                                +{resource.links.length - 2} more
                              </Text>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Suggested Resources For You Section */}
        {!loading && assignedResourceDetails.length > 0 && (
          <View className="mb-12 px-4">
            <View className="items-center mb-6">
              <View className="flex-row items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-3">
                <Ionicons name="sparkles" size={16} color="#4f46e5" />
                <Text className="text-sm font-semibold text-indigo-700">
                  Personalized for You
                </Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
                Suggested Resources
              </Text>
              <Text className="text-base text-gray-600 text-center max-w-[500px]">
                Resources recommended by your advisor to support your mental
                wellness journey
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-4">
                {assignedResourceDetails.map(resource => (
                  <View
                    key={resource.id}
                    className="w-[280px] bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    {resource.image_url ? (
                      <View className="h-48 overflow-hidden">
                        <Image
                          source={{ uri: resource.image_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center">
                        <Ionicons name="book" size={64} color="white" />
                      </View>
                    )}
                    <View className="p-5">
                      <View className="flex-row items-center gap-2 mb-3">
                        {resource.category && (
                          <View className="px-2 py-1 bg-indigo-100 rounded-full">
                            <Text className="text-xs font-semibold text-indigo-700">
                              {resource.category}
                            </Text>
                          </View>
                        )}
                        <Ionicons name="star" size={16} color="#6366f1" />
                      </View>
                      <Text className="text-lg font-bold text-gray-900 mb-2">
                        {resource.title}
                      </Text>
                      <Text
                        className="text-gray-600 text-sm mb-4"
                        numberOfLines={3}
                      >
                        {resource.description}
                      </Text>
                      {resource.links && resource.links.length > 0 && (
                        <View className="mt-auto">
                          <Text className="text-xs font-medium text-gray-600 mb-2">
                            Links:
                          </Text>
                          <View className="flex-row flex-wrap gap-2">
                            {resource.links.slice(0, 2).map((link, index) => (
                              <TouchableOpacity
                                key={index}
                                onPress={() => {
                                  /* Open link */
                                }}
                                className="flex-row items-center px-2 py-1 bg-indigo-50 border border-indigo-200 rounded"
                              >
                                <Ionicons
                                  name="link"
                                  size={12}
                                  color="#4338ca"
                                />
                                <Text className="text-xs font-medium text-indigo-700 ml-1">
                                  {extractDomain(link)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            {resource.links.length > 2 && (
                              <Text className="text-xs text-gray-500 px-2 py-1">
                                +{resource.links.length - 2} more
                              </Text>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Footer */}
        <View className="items-center p-8 bg-white rounded-2xl shadow-sm mx-4 mb-10">
          <Text className="text-base text-gray-600 text-center mb-4">
            A safe, accessible, and stigma-free platform for mental health
            support.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('About')}>
            <Text className="text-base text-indigo-500 font-semibold">
              Learn more about our mission →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Mood Modal */}
      <DailyMoodModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSave={handleSaveMood}
      />
    </ScrollView>
  )
}

export default Home
