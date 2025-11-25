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
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axiosInstance from '../utils/axios.instance'
import { setUser } from '../store/slices/authSlice'

const Register = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async () => {
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', "Passwords don't match!")
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/auth/register', formData)
      const { profile, access_token, refresh_token } = res.data

      // Navigate to home screen
      navigation.navigate('Login')
    } catch (e) {
      Alert.alert(
        'Registration Failed',
        e.response?.data?.message || 'Internal Server Error',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-row items-center mb-8"
          >
            <Text className="text-blue-600 text-base font-medium">← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              Create account
            </Text>
            <Text className="text-base text-gray-600">
              Sign up to get started
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Username Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Name
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900"
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={formData.username}
                onChangeText={value => handleChange('username', value)}
                autoCapitalize="words"
              />
            </View>

            {/* Email Field */}
            <View className="mt-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900"
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
            <View className="mt-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900"
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={value => handleChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password Field */}
            <View className="mt-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900"
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={value => handleChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`mt-6 rounded-xl py-4 ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center text-base font-semibold">
                {loading ? 'Creating account...' : 'Create account'}
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600 text-sm">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-blue-600 text-sm font-semibold">
                  Sign in
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Register
