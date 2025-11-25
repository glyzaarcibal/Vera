import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import axiosInstance from '../utils/axios.instance'

const Welcome = ({ navigation }) => {
  useEffect(() => {
    retrieveDailyMoods()
  }, [])
  const retrieveDailyMoods = async () => {
    try {
      const res = await axiosInstance.get('/moods/retrieve-daily-moods')
      console.log(res.data)
    } catch (e) {
      alert(e.response.data.message || 'Internal Server Error')
    }
  }
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
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-8 py-3.5 rounded-xl shadow-lg"
              >
                <Text className="text-white text-base font-semibold text-center">
                  Get Started
                </Text>
              </LinearGradient>
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
    </ScrollView>
  )
}

export default Welcome
