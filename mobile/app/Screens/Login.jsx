import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axiosInstance from '../utils/axios.instance'
import { setUser } from '../store/slices/authSlice'

const Login = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/auth/login', formData)
      const { profile, access_token, refresh_token } = res.data

      await AsyncStorage.setItem('access_token', access_token)
      await AsyncStorage.setItem('refresh_token', refresh_token)

      dispatch(setUser(profile))

      if (profile.role === 'admin') {
        Alert.alert(
          'Choose View',
          'Where would you like to go?',
          [
            {
              text: 'Client View',
              onPress: () => navigation.navigate('ClientStack'),
            },
            {
              text: 'Admin View',
              onPress: () => navigation.navigate('AdminDrawer'),
            },
          ],
          { cancelable: false },
        )
      } else {
        navigation.navigate('ClientStack')
      }
    } catch (e) {
      Alert.alert(
        'Login Failed',
        e.response?.data?.message || 'Internal Server Error',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-indigo-50"
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerClassName="flex-grow justify-center"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10">

          {/* V.E.R.A Branding Section */}
          <View className="items-center mb-10">
            <View className="bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg mb-4">
              <Text className="text-white text-xl font-bold tracking-widest">
                V.E.R.A
              </Text>
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center">
              Voice Emotion Recognition Application
            </Text>

            <Text className="text-gray-600 mt-3 text-center leading-5 px-2">
              An AI-powered system that analyzes vocal patterns to detect 
              emotional states in real-time. Designed to support mental 
              wellness insights, behavioral analysis, and intelligent response systems.
            </Text>
          </View>

          {/* Card Container */}
          <View className="bg-white rounded-3xl p-6 shadow-xl">

            <Text className="text-xl font-bold text-gray-900 mb-1">
              Welcome Back 👋
            </Text>
            <Text className="text-gray-500 mb-6">
              Sign in to access emotion analytics and voice insights.
            </Text>

            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={value => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password Field */}
            <View className="mb-2">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={value => handleChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Forgot Password */}
            <View className="flex-row justify-end mb-6">
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text className="text-sm text-indigo-600 font-semibold">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`rounded-xl py-4 ${
                loading ? 'bg-indigo-400' : 'bg-indigo-600'
              }`}
            >
              <Text className="text-white text-center text-base font-bold">
                {loading ? 'Authenticating...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-gray-400 text-sm">OR</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Sign Up Section */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-sm">
                New to V.E.R.A?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
              >
                <Text className="text-indigo-600 text-sm font-bold">
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Extra Info Section */}
          <View className="mt-8 px-2">
            <Text className="text-center text-gray-500 text-xs leading-5">
              🔐 Secure authentication • 📊 Real-time emotion analysis
            </Text>

            <Text className="text-center text-gray-400 text-xs mt-4">
              Powered by AI-driven emotion classification models.
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login