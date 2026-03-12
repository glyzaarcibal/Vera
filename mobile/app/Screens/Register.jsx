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
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      const { profile, access_token, refresh_token, message } = res.data

      if (profile && access_token && refresh_token) {
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
          return
        }

        navigation.navigate('ClientStack')
        return
      }

      navigation.navigate('EmailVerified', {
        email: formData.email,
        message: message || 'Enter the verification code sent to your email.',
      })
    } catch (e) {
      const isNetworkError = !e.response || e.message === 'Network Error'
      const message = isNetworkError
        ? 'Cannot reach server. Make sure the backend is running and your phone uses the same Wi-Fi as your laptop.'
        : e.response?.data?.details ||
          e.response?.data?.message ||
          'Internal Server Error'

      Alert.alert(
        'Registration Failed',
        message,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.blob, styles.blobTopRight]} />
        <View style={[styles.blob, styles.blobMidLeft]} />
        <View style={[styles.blob, styles.blobBottomRight]} />

        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="#2D1B4E" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>CREATE YOUR ACCOUNT</Text>
            </View>
            <Text style={styles.heroTitle}>Join VERA</Text>
            <Text style={styles.heroSubtitle}>
              Build healthy routines with guided mood support and practical
              tools for your day.
            </Text>

            <View style={styles.benefitsRow}>
              <View style={styles.benefitCard}>
                <Ionicons name="heart-outline" size={16} color="#E11D48" />
                <Text style={styles.benefitText}>Daily check-ins</Text>
              </View>
              <View style={styles.benefitCard}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#7C3AED"
                />
                <Text style={styles.benefitText}>Private data</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSubtitle}>
              Start your journey in under a minute
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#8B5CF6" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#B6A9BE"
                  value={formData.username}
                  onChangeText={value => handleChange('username', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#8B5CF6" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#B6A9BE"
                  value={formData.email}
                  onChangeText={value => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#8B5CF6"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#B6A9BE"
                  value={formData.password}
                  onChangeText={value => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#8B5CF6"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#8B5CF6"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#B6A9BE"
                  value={formData.confirmPassword}
                  onChangeText={value => handleChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#8B5CF6"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              activeOpacity={0.88}
            >
              {loading && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.submitText}>
                {loading ? 'Creating account...' : 'Create account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signInRow}>
              <Text style={styles.signInLabel}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>
            Your progress starts with one small step.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Register

const PEACH = '#FF9E7D'
const LAVENDER = '#A78BFA'
const WARM_BG = '#FFF8F3'

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: WARM_BG,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.34,
  },
  blobTopRight: {
    width: 260,
    height: 260,
    top: -70,
    right: -70,
    backgroundColor: '#FBBF9A',
  },
  blobMidLeft: {
    width: 210,
    height: 210,
    top: 290,
    left: -80,
    backgroundColor: '#C4B5FD',
  },
  blobBottomRight: {
    width: 240,
    height: 240,
    bottom: -70,
    right: -60,
    backgroundColor: '#6EE7B7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 34,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFFCC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F2DFD2',
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B4E',
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4D6',
    shadowColor: '#E8A87C',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E8',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FBBF9A',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10,
    color: '#C56A18',
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6A5C7C',
  },
  benefitsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  benefitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9F4FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EADFFF',
  },
  benefitText: {
    color: '#5B4C70',
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#EFE4F5',
    shadowColor: '#B794F4',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D1B4E',
  },
  formSubtitle: {
    marginTop: 4,
    marginBottom: 18,
    fontSize: 13,
    color: '#7A6B8E',
  },
  fieldGroup: {},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4C3F63',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFF0',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FCFAFF',
    minHeight: 50,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#2D1B4E',
    fontSize: 15,
  },
  submitBtn: {
    marginTop: 22,
    backgroundColor: LAVENDER,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: LAVENDER,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitBtnLoading: {
    opacity: 0.82,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  signInRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInLabel: {
    fontSize: 13,
    color: '#6E6180',
    marginRight: 6,
  },
  signInLink: {
    fontSize: 13,
    color: PEACH,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: '#7F7290',
  },
})
