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
import axiosInstance from '../utils/axios.instance'

const ForgotPassword = () => {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address')
      return
    }

    setLoading(true)
    try {
      await axiosInstance.post('/auth/forgot-password', { email: email.trim() })
      setIsSubmitted(true)
    } catch (e) {
      const isNetworkError = !e.response || e.message === 'Network Error'
      const message = isNetworkError
        ? 'Cannot reach server. Check your network and API URL in EXPO_PUBLIC_API_URL.'
        : e.response?.data?.message || 'Internal Server Error'

      Alert.alert('Request Failed', message)
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
        <View style={[styles.blob, styles.blobBottomLeft]} />

        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              {isSubmitted
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive a password reset link'}
            </Text>

            {!isSubmitted ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={18} color="#A78BFA" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#C4B5C8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                  activeOpacity={0.85}
                >
                  {loading && (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.submitText}>
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.linkText}>Remember your password? Sign in</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark" size={26} color="#fff" />
                </View>
                <Text style={styles.successText}>
                  We have sent a password reset link to <Text style={styles.strong}>{email}</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.submitBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitText}>Back to login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ForgotPassword

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
    opacity: 0.35,
  },
  blobTopRight: {
    width: 250,
    height: 250,
    top: -80,
    right: -70,
    backgroundColor: '#FBBF9A',
  },
  blobBottomLeft: {
    width: 220,
    height: 220,
    bottom: -70,
    left: -80,
    backgroundColor: '#DDD6FE',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  fieldGroup: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#FAF5FF',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  submitBtn: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnLoading: {
    opacity: 0.9,
  },
  submitText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  linkRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  successCard: {
    marginTop: 16,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    marginTop: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  strong: {
    fontWeight: '800',
    color: '#111827',
  },
})
