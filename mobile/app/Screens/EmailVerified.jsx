import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axiosInstance from '../utils/axios.instance'
import { setUser } from '../store/slices/authSlice'

const EmailVerified = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const dispatch = useDispatch()
  const inputRefs = useRef([])

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const email = route.params?.email || ''
  const infoMessage =
    route.params?.message || 'Enter the 6-digit verification code sent to your email.'

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 150)

    return () => clearTimeout(timer)
  }, [])

  const handleSuccessfulVerification = async responseData => {
    const { profile, access_token, refresh_token } = responseData

    if (access_token) {
      await AsyncStorage.setItem('access_token', access_token)
    }

    if (refresh_token) {
      await AsyncStorage.setItem('refresh_token', refresh_token)
    }

    if (profile) {
      dispatch(setUser(profile))
    }

    if (profile?.role === 'admin') {
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
  }

  const handleVerify = async providedCode => {
    const finalCode = providedCode || code.join('')
    if (finalCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code.')
      return
    }

    setVerifying(true)
    setErrorMessage('')

    try {
      const response = await axiosInstance.post('/auth/verify-account', {
        code: finalCode,
      })

      await handleSuccessfulVerification(response.data)
    } catch (error) {
      setCode(['', '', '', '', '', ''])
      setErrorMessage(
        error.response?.data?.message || 'Invalid or expired code.',
      )
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } finally {
      setVerifying(false)
    }
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) {
      return
    }

    const digit = value.slice(-1)
    const nextCode = [...code]
    nextCode[index] = digit
    setCode(nextCode)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (digit && nextCode.every(item => item !== '')) {
      handleVerify(nextCode.join(''))
    }
  }

  const handleKeyPress = (index, event) => {
    if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Email missing', 'Please register again to request a new code.')
      return
    }

    setResending(true)
    setErrorMessage('')

    try {
      const response = await axiosInstance.post('/auth/resend-verification', {
        email,
      })
      Alert.alert('Code sent', response.data?.message || 'A new code has been sent.')
    } catch (error) {
      Alert.alert(
        'Resend failed',
        error.response?.data?.message || 'Failed to resend verification code.',
      )
    } finally {
      setResending(false)
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
        <View style={[styles.blob, styles.blobBottomLeft]} />

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
            <View style={styles.iconBadge}>
              <Ionicons name="mail-open-outline" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.heroTitle}>Verify your email</Text>
            <Text style={styles.heroSubtitle}>{infoMessage}</Text>
            <Text style={styles.emailText}>{email || 'your email address'}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Enter code</Text>
            <Text style={styles.formSubtitle}>
              The code expires after 10 minutes.
            </Text>

            <View style={styles.otpRow}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref
                  }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={value => handleChange(index, value)}
                  onKeyPress={event => handleKeyPress(index, event)}
                  textAlign="center"
                  editable={!verifying}
                />
              ))}
            </View>

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, verifying && styles.submitBtnDisabled]}
              onPress={() => handleVerify()}
              disabled={verifying}
              activeOpacity={0.88}
            >
              {verifying && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.submitText}>
                {verifying ? 'Verifying...' : 'Verify code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResendCode}
              disabled={resending}
              activeOpacity={0.82}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <Text style={styles.secondaryButtonText}>Resend code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default EmailVerified

const WARM_BG = '#FFF8F3'
const LAVENDER = '#A78BFA'

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
    opacity: 0.32,
  },
  blobTopRight: {
    width: 260,
    height: 260,
    top: -70,
    right: -70,
    backgroundColor: '#FBBF9A',
  },
  blobBottomLeft: {
    width: 220,
    height: 220,
    bottom: -70,
    left: -70,
    backgroundColor: '#C4B5FD',
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
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0FF',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D1B4E',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6A5C7C',
  },
  emailText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '700',
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFF0',
    backgroundColor: '#FCFAFF',
    fontSize: 22,
    fontWeight: '700',
    color: '#2D1B4E',
  },
  errorText: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 22,
    backgroundColor: LAVENDER,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnDisabled: {
    opacity: 0.82,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCCEFF',
    backgroundColor: '#F8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '700',
  },
})