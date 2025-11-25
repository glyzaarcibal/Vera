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

const Login = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: 'codog@gmail.co',
    password: 'secret123',
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

      // Store tokens in AsyncStorage
      await AsyncStorage.setItem('access_token', access_token)
      await AsyncStorage.setItem('refresh_token', refresh_token)

      // Store user profile in Redux
      dispatch(setUser(profile))

      // Navigate based on role
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
              Welcome back
            </Text>
            <Text className="text-base text-gray-600">
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            {/* Email Field */}
            <View>
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
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={value => handleChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Forgot Password */}
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text className="text-sm text-blue-600 font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`mt-6 rounded-xl py-4 ${
                loading ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center text-base font-semibold">
                {loading ? 'Signing in...' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600 text-sm">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-blue-600 text-sm font-semibold">
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login
