import React, { useState, useRef, useEffect } from 'react'
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
  Animated,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axiosInstance from '../utils/axios.instance'
import { setUser } from '../store/slices/authSlice'

const { width } = Dimensions.get('window')

const Login = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Fade-in animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const wave1 = useRef(new Animated.Value(0)).current
  const wave2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start()

    // Gentle breathing blobs
    const breathe = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 4000 + delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 4000 + delay, useNativeDriver: true }),
        ])
      ).start()

    breathe(wave1, 0)
    breathe(wave2, 800)
  }, [])

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
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

  const blob1Scale = wave1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] })
  const blob2Scale = wave2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] })

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
        {/* Animated soft blobs */}
        <Animated.View
          style={[styles.blob, styles.blob1, { transform: [{ scale: blob1Scale }] }]}
        />
        <Animated.View
          style={[styles.blob, styles.blob2, { transform: [{ scale: blob2Scale }] }]}
        />
        <View style={[styles.blob, styles.blob3]} />

        <Animated.View
          style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── Brand Section ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Text style={styles.logoLeaf}>🌿</Text>
              </View>
            </View>
            <Text style={styles.brandName}>VERA</Text>
            <Text style={styles.brandTagline}>Your gentle companion for a calmer mind</Text>
          </View>

          {/* ── Pillars Strip ── */}
          <View style={styles.pillarsRow}>
            {[
              { icon: '🌙', label: 'Rest' },
              { icon: '🫧', label: 'Breathe' },
              { icon: '🌱', label: 'Grow' },
              { icon: '🔒', label: 'Private' },
            ].map((p) => (
              <View key={p.label} style={styles.pillar}>
                <Text style={styles.pillarIcon}>{p.icon}</Text>
                <Text style={styles.pillarLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>
            <Text style={styles.formGreeting}>Welcome back 👋</Text>
            <Text style={styles.formHint}>Sign in to continue your journey</Text>

            {/* Thin sage accent line */}
            <View style={styles.accentLine} />

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[styles.inputShell, emailFocused && styles.inputShellFocused]}>
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={emailFocused ? '#9B7FD4' : '#C4B8DC'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#C7D4CD"
                  value={formData.email}
                  onChangeText={v => handleChange('email', v)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={[styles.fieldWrap, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputShell, passwordFocused && styles.inputShellFocused]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={passwordFocused ? '#9B7FD4' : '#C4B8DC'}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#C7D4CD"
                  value={formData.password}
                  onChangeText={v => handleChange('password', v)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(p => !p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color="#C4B8DC"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.cta, loading && styles.ctaLoading]}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.ctaText}>Sign in</Text>
                  <View style={styles.ctaArrow}>
                    <Ionicons name="arrow-forward" size={16} color="#6D4FA0" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>new to VERA?</Text>
              <View style={styles.divLine} />
            </View>

            {/* Register */}
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.82}
            >
              <Text style={styles.registerText}>Create a free account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer affirmation */}
          <View style={styles.affirmRow}>
            <View style={styles.affirmDot} />
            <Text style={styles.affirmText}>
              You're doing something meaningful for yourself today.
            </Text>
            <View style={styles.affirmDot} />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login

/* ─────────────────────────────────────────────
   TOKENS — Pastel Violet
───────────────────────────────────────────── */
const BG         = '#F5F3FF'   // soft lavender-white
const VIOLET     = '#9B7FD4'   // primary pastel violet
const VIOLET_DEEP= '#6D4FA0'   // deep violet for arrows / text
const VIOLET_MIST= '#EDE9FB'   // very light violet tint
const STONE      = '#2A1F45'   // deep plum for headings
const MUTED      = '#8B7BA8'   // muted violet-grey
const CARD       = '#FFFFFF'

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: BG },
  scrollContent: { flexGrow: 1, backgroundColor: BG },

  /* Blobs */
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: {
    width: 320,
    height: 320,
    top: -100,
    right: -100,
    backgroundColor: '#C9B8F0',
    opacity: 0.45,
  },
  blob2: {
    width: 240,
    height: 240,
    top: 300,
    left: -90,
    backgroundColor: '#B8A4E8',
    opacity: 0.3,
  },
  blob3: {
    width: 200,
    height: 200,
    bottom: -70,
    right: -50,
    backgroundColor: '#D6CAF5',
    opacity: 0.4,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 40,
  },

  /* Brand */
  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#C4B0E8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    shadowColor: VIOLET,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginBottom: 14,
  },
  logoInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: VIOLET_MIST,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLeaf: { fontSize: 26 },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: STONE,
    letterSpacing: 6,
  },
  brandTagline: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  /* Pillars */
  pillarsRow: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: VIOLET,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E0F8',
  },
  pillar: { flex: 1, alignItems: 'center' },
  pillarIcon: { fontSize: 20, marginBottom: 4 },
  pillarLabel: { fontSize: 11, color: MUTED, fontWeight: '600', letterSpacing: 0.3 },

  /* Form card */
  formCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: VIOLET_DEEP,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E8E0F8',
  },
  formGreeting: {
    fontSize: 24,
    fontWeight: '800',
    color: STONE,
    letterSpacing: -0.3,
  },
  formHint: {
    fontSize: 13.5,
    color: MUTED,
    marginTop: 4,
    marginBottom: 16,
  },
  accentLine: {
    height: 2,
    width: 36,
    backgroundColor: VIOLET,
    borderRadius: 2,
    marginBottom: 22,
    opacity: 0.7,
  },

  /* Fields */
  fieldWrap: {},
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: STONE,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    opacity: 0.7,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD5F5',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputShellFocused: {
    borderColor: VIOLET,
    backgroundColor: '#F2EEFF',
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingLeft: 10,
    fontSize: 15,
    color: STONE,
  },

  /* Forgot */
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: VIOLET,
  },

  /* CTA */
  cta: {
    marginTop: 20,
    backgroundColor: VIOLET,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: VIOLET_DEEP,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaLoading: { backgroundColor: '#BBA9E2' },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  ctaArrow: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Divider */
  divRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#E8E0F8' },
  divText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#C0B0D8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Register */
  registerBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C4B0E8',
    backgroundColor: VIOLET_MIST,
  },
  registerText: {
    fontSize: 15,
    fontWeight: '700',
    color: VIOLET_DEEP,
  },

  /* Footer */
  affirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingHorizontal: 10,
  },
  affirmDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C4B0E8',
    marginHorizontal: 10,
  },
  affirmText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12.5,
    color: '#C0B0D8',
    fontWeight: '500',
    lineHeight: 18,
  },
})