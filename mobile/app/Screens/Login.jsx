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

const Login = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
            { text: 'Client View', onPress: () => navigation.navigate('ClientStack') },
            { text: 'Admin View', onPress: () => navigation.navigate('AdminDrawer') },
          ],
          { cancelable: false },
        )
      } else {
        navigation.navigate('ClientStack')
      }
    } catch (e) {
      const isNetworkError = !e.response || e.message === 'Network Error'
      const message = isNetworkError
        ? 'Cannot reach server. Make sure phone and laptop are on the same Wi-Fi, backend is running, and EXPO_PUBLIC_API_URL points to your laptop LAN IP.'
        : e.response?.data?.message || 'Internal Server Error'

      Alert.alert('Login Failed', message)
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
        {/* Warm soft background blobs */}
        <View style={[styles.blob, styles.blobTopRight]} />
        <View style={[styles.blob, styles.blobMidLeft]} />
        <View style={[styles.blob, styles.blobBottomRight]} />

        <View style={styles.container}>

          {/* ── Hero Card ── */}
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🌿  YOUR WELLNESS SPACE</Text>
            </View>

            <Text style={styles.heroTitle}>Welcome back{'\n'}to VERA</Text>

            <Text style={styles.heroSubtitle}>
              A gentle place to check in, breathe, and grow — one mindful moment at a time.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>24/7</Text>
                <Text style={styles.statLabel}>Calm Tools</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statValue}>🔒</Text>
                <Text style={styles.statLabel}>Private & Safe</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statValue}>✦</Text>
                <Text style={styles.statLabel}>Your Journey</Text>
              </View>
            </View>
          </View>

          {/* ── Sign-in Card ── */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSubtitle}>Continue where you left off ☀️</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
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
            </View>

            {/* Password */}
            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#A78BFA" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
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
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
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
                {loading ? 'Signing in…' : 'Sign in  →'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>new here?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.signupText}>Create an account</Text>
            </TouchableOpacity>
          </View>

          {/* Affirmation footer */}
          <Text style={styles.affirmation}>
            💛  You're taking a step toward feeling better.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login

/* ─────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────── */
const PEACH    = '#FF9E7D'
const LAVENDER = '#A78BFA'
const WARM_BG  = '#FFF8F3'
const CARD_BG  = '#FFFFFF'

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: WARM_BG,
  },

  /* Blobs */
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
    width: 200,
    height: 200,
    top: 260,
    left: -70,
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
    paddingTop: 60,
    paddingBottom: 36,
  },

  /* Hero */
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
    letterSpacing: 1.1,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9D8BAA',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#FFD6C0',
  },

  /* Form */
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: LAVENDER,
  },

  /* Submit button */
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
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Divider */
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

  /* Sign up button */
  signupBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: LAVENDER,
    backgroundColor: '#F5F3FF',
  },
  signupText: {
    fontSize: 15,
    fontWeight: '700',
    color: LAVENDER,
  },

  /* Footer */
  affirmation: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: '#B8A9C9',
    fontWeight: '500',
  },
})