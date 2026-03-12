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
    contactNumber: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username) {
      newErrors.username = 'Name is required'
    } else if (formData.username.length < 2) {
      newErrors.username = 'Name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required'
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid contact number'
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required'
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      if (Number.isNaN(birthDate.getTime())) {
        newErrors.birthDate = 'Please use YYYY-MM-DD format'
      } else if (age < 13) {
        newErrors.birthDate = 'You must be at least 13 years old'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must include uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
    }

    return newErrors
  }

  const handleSubmit = async () => {
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      Alert.alert('Error', Object.values(newErrors)[0])
      return
    }

    setLoading(true)

    try {
      const res = await axiosInstance.post('/auth/register', formData)

      if (res.data.profile) {
        const { profile, access_token, refresh_token } = res.data

        if (access_token && refresh_token) {
          await AsyncStorage.setItem('access_token', access_token)
          await AsyncStorage.setItem('refresh_token', refresh_token)
        }

        dispatch(setUser(profile))
        navigation.navigate(
          profile?.role === 'admin' ? 'AdminDrawer' : 'ClientStack',
        )
      } else {
        Alert.alert(
          'Verify your email',
          'Please check your email for the verification code before signing in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        )
      }
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
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={18} color="#8B5CF6" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>BEGIN YOUR JOURNEY</Text>
            </View>

            <Text style={styles.heroTitle}>{'Create your\nVERA space'}</Text>

            <Text style={styles.heroSubtitle}>
              Build a calm, private place for daily check-ins, gentle routines,
              and support that moves at your pace.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Daily</Text>
                <Text style={styles.statLabel}>Mood Tracking</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Safe</Text>
                <Text style={styles.statLabel}>Personal Space</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statValue}>Guided</Text>
                <Text style={styles.statLabel}>Small Steps</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSubtitle}>
              Set up your profile in a few details
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#C4B5C8"
                  value={formData.username}
                  onChangeText={value => handleChange('username', value)}
                  autoCapitalize="words"
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            <View style={[styles.fieldGroup, styles.fieldSpacing]}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#C4B5C8"
                  value={formData.email}
                  onChangeText={value => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={[styles.fieldGroup, styles.fieldSpacing]}>
              <Text style={styles.label}>Contact Number</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your contact number"
                  placeholderTextColor="#C4B5C8"
                  value={formData.contactNumber}
                  onChangeText={value => handleChange('contactNumber', value)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.contactNumber ? (
                <Text style={styles.errorText}>{errors.contactNumber}</Text>
              ) : null}
              <Text style={styles.helperText}>Format: +1234567890</Text>
            </View>

            <View style={[styles.fieldGroup, styles.fieldSpacing]}>
              <Text style={styles.label}>Birth Date</Text>
              <View style={styles.inputRow}>
                <Ionicons name="calendar-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C4B5C8"
                  value={formData.birthDate}
                  onChangeText={value => handleChange('birthDate', value)}
                  autoCapitalize="none"
                />
              </View>
              {errors.birthDate ? (
                <Text style={styles.errorText}>{errors.birthDate}</Text>
              ) : null}
            </View>

            <View style={[styles.fieldGroup, styles.fieldSpacing]}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#C4B5C8"
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
                    color="#A78BFA"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={[styles.fieldGroup, styles.fieldSpacing]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#A78BFA"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#C4B5C8"
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
                    color="#A78BFA"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <Text style={styles.helperText}>
              Password must be at least 8 characters with uppercase,
              lowercase, and number
            </Text>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.submitLoader}
                />
              ) : null}
              <Text style={styles.submitText}>
                {loading ? 'Creating account...' : 'Create account  ->'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>already with vera?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>Sign in instead</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.affirmation}>
            You are setting up a softer routine for yourself.
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
const CARD_BG = '#FFFFFF'

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
    opacity: 0.35,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
    backgroundColor: '#FBBF9A',
  },
  blobMidLeft: {
    width: 220,
    height: 220,
    top: 340,
    left: -80,
    backgroundColor: '#C4B5FD',
  },
  blobBottomRight: {
    width: 240,
    height: 240,
    bottom: -60,
    right: -40,
    backgroundColor: '#6EE7B7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: CARD_BG,
    paddingHorizontal: 22,
    paddingVertical: 26,
    marginBottom: 18,
    shadowColor: '#E8A87C',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FBBF9A',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2D1B4E',
    lineHeight: 40,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#7C6B8A',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9D8BAA',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FFD6C0',
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: CARD_BG,
    paddingHorizontal: 22,
    paddingVertical: 26,
    shadowColor: '#C4B5FD',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D1B4E',
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#9D8BAA',
    marginTop: 4,
    marginBottom: 22,
  },
  fieldGroup: {},
  fieldSpacing: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B4C72',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingLeft: 10,
    fontSize: 15,
    color: '#2D1B4E',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9D8BAA',
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PEACH,
    shadowColor: PEACH,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  submitBtnLoading: {
    backgroundColor: '#FFC4A8',
  },
  submitLoader: {
    marginRight: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDE9FE',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#B8A9C9',
    fontWeight: '500',
  },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LAVENDER,
    backgroundColor: '#F5F3FF',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: LAVENDER,
  },
  affirmation: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: '#B8A9C9',
    fontWeight: '500',
  },
})
