import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'

import axiosInstance from '../../../utils/axios.instance'
import { selectUser } from '../../../store/slices/authSelectors'

const BREATHING_TYPES = [
  {
    id: 'relaxing',
    name: 'Relaxing (6-7-8)',
    nameTl: 'Relaks (6-7-8)',
    inhaleMs: 6000,
    holdMs: 7000,
    exhaleMs: 8000,
  },
  {
    id: 'box',
    name: 'Box (4-4-4)',
    nameTl: 'Box (4-4-4)',
    inhaleMs: 4000,
    holdMs: 4000,
    exhaleMs: 4000,
  },
  {
    id: '478',
    name: '4-7-8 Calm',
    nameTl: '4-7-8 Kalmado',
    inhaleMs: 4000,
    holdMs: 7000,
    exhaleMs: 8000,
  },
  {
    id: 'calm',
    name: 'Calm (4-2-6)',
    nameTl: 'Kalmado (4-2-6)',
    inhaleMs: 4000,
    holdMs: 2000,
    exhaleMs: 6000,
  },
]

const TEXTS = {
  English: {
    getReady: 'Get ready...',
    inhale: 'Inhale...',
    hold: 'Hold...',
    exhale: 'Exhale...',
    startBreathing: 'Start Breathing',
    showHistory: 'Show History',
    hideHistory: 'Hide History',
    breathingHistory: 'Breathing History',
    clearAll: 'Clear All',
    noHistory: 'No history yet',
    date: 'Date',
    time: 'Time',
    type: 'Type',
    chooseType: 'Choose breathing type',
  },
  Tagalog: {
    getReady: 'Handa na...',
    inhale: 'Huminga papasok...',
    hold: 'Pigil...',
    exhale: 'Huminga palabas...',
    startBreathing: 'Magsimula ng Paghinga',
    showHistory: 'Ipakita ang Kasaysayan',
    hideHistory: 'Itago ang Kasaysayan',
    breathingHistory: 'Kasaysayan ng Paghinga',
    clearAll: 'Burahin Lahat',
    noHistory: 'Wala pang kasaysayan',
    date: 'Petsa',
    time: 'Oras',
    type: 'Uri',
    chooseType: 'Pumili ng uri ng paghinga',
  },
}

const safeTimeout = (refList, fn, delay) => {
  const id = setTimeout(fn, delay)
  refList.current.push(id)
  return id
}

export default function TakeABreath({ navigation }) {
  const authState = useSelector(selectUser)
  const user = authState?.user ?? authState

  const [breathingStage, setBreathingStage] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const [repeatCount, setRepeatCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [language, setLanguage] = useState('English')
  const [breathType, setBreathType] = useState(BREATHING_TYPES[0].id)

  const timeoutsRef = useRef([])
  const scaleAnim = useRef(new Animated.Value(1)).current

  const t = TEXTS[language] || TEXTS.English

  useEffect(() => {
    loadHistory()
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutsRef.current = []
    }
  }, [user?.id, user?.user_id, user?.userId])

  useEffect(() => {
    if (!isBreathing || countdown > 0) {
      return
    }

    const preset = BREATHING_TYPES.find(item => item.id === breathType) || BREATHING_TYPES[0]

    let timing = 0
    let targetScale = 1

    if (breathingStage === 0) {
      targetScale = 1.5
      timing = preset.inhaleMs
    } else if (breathingStage === 1) {
      targetScale = 1.5
      timing = preset.holdMs
    } else if (breathingStage === 2) {
      targetScale = 1
      timing = preset.exhaleMs
    }

    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: timing,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()

    const timer = setTimeout(async () => {
      if (breathingStage === 2) {
        if (repeatCount < 1) {
          setRepeatCount(previous => previous + 1)
          setBreathingStage(0)
        } else {
          setIsBreathing(false)
          setBreathingStage(0)
          setRepeatCount(0)
          scaleAnim.setValue(1)
          await addHistory()
        }
      } else {
        setBreathingStage(previous => previous + 1)
      }
    }, timing)

    return () => clearTimeout(timer)
  }, [breathingStage, breathType, countdown, isBreathing, repeatCount, scaleAnim])

  const stageText = useMemo(() => {
    if (!isBreathing) {
      return ''
    }

    if (countdown > 0) {
      return `${t.getReady} ${countdown}`
    }

    return [t.inhale, t.hold, t.exhale][breathingStage] || ''
  }, [breathingStage, countdown, isBreathing, t])

  const loadHistory = async () => {
    try {
      const response = await axiosInstance.get('/activities')
      const activities = response.data?.activities || []

      const historyItems = activities
        .filter(activity => activity.activity_type === 'breath')
        .map(activity => ({
          id: activity.id,
          ...activity.data,
        }))
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

      setHistory(historyItems)
    } catch (error) {
      console.error('Error loading breath history:', error)
    }
  }

  const addHistory = async () => {
    const now = new Date()
    const preset = BREATHING_TYPES.find(item => item.id === breathType) || BREATHING_TYPES[0]

    const newEntry = {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      type: breathType,
      typeLabel: language === 'Tagalog' ? preset.nameTl : preset.name,
      timestamp: now.toISOString(),
    }

    try {
      await axiosInstance.post('/activities/save', {
        activityType: 'breath',
        data: newEntry,
      })

      await loadHistory()
    } catch (error) {
      console.error('Error saving breath history:', error)
    }
  }

  const startBreathing = () => {
    if (isBreathing) {
      return
    }

    timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId))
    timeoutsRef.current = []

    setIsBreathing(true)
    setBreathingStage(0)
    setRepeatCount(0)
    setCountdown(3)

    // Audio hooks are intentionally no-op until mobile audio assets are added.
    safeTimeout(timeoutsRef, () => setCountdown(3), 1000)
    safeTimeout(timeoutsRef, () => setCountdown(2), 2000)
    safeTimeout(timeoutsRef, () => setCountdown(1), 3000)
    safeTimeout(timeoutsRef, () => setCountdown(0), 4000)
  }

  const clearHistory = () => {
    Alert.alert('Clear history', 'Clear breathing history from the current view?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => setHistory([]),
      },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#6366f1" />
        </TouchableOpacity>

        {!isBreathing ? (
          <View style={styles.languageRow}>
            <TouchableOpacity
              onPress={() => setLanguage('English')}
              style={[styles.langButton, language === 'English' ? styles.langButtonActive : null]}
            >
              <Text style={[styles.langButtonText, language === 'English' ? styles.langButtonTextActive : null]}>
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage('Tagalog')}
              style={[styles.langButton, language === 'Tagalog' ? styles.langButtonActive : null]}
            >
              <Text style={[styles.langButtonText, language === 'Tagalog' ? styles.langButtonTextActive : null]}>
                Tagalog
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.title}>Take a Breath</Text>

        <View style={styles.mainSection}>
          <Animated.View style={[styles.breathCircle, { transform: [{ scale: scaleAnim }] }]} />

          <Text style={styles.stageText}>{stageText}</Text>

          {!isBreathing ? (
            <>
              <Text style={styles.presetLabel}>{t.chooseType}</Text>
              <View style={styles.presetWrap}>
                {BREATHING_TYPES.map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => setBreathType(preset.id)}
                    style={[styles.presetChip, breathType === preset.id ? styles.presetChipActive : null]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        breathType === preset.id ? styles.presetChipTextActive : null,
                      ]}
                    >
                      {language === 'Tagalog' ? preset.nameTl : preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={startBreathing}>
                <Text style={styles.primaryButtonText}>{t.startBreathing}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowHistory(previous => !previous)}
              >
                <Text style={styles.secondaryButtonText}>
                  {showHistory ? t.hideHistory : t.showHistory}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {showHistory ? (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{t.breathingHistory}</Text>
              {history.length > 0 ? (
                <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>{t.clearAll}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>{t.date}</Text>
              <Text style={styles.tableHeaderCell}>{t.time}</Text>
              <Text style={styles.tableHeaderCell}>{t.type}</Text>
            </View>

            {history.length > 0 ? (
              history.map((item, index) => {
                const typeLabel =
                  item.typeLabel ||
                  (() => {
                    const preset = BREATHING_TYPES.find(value => value.id === (item.type || 'relaxing'))
                    if (!preset) {
                      return item.type || '-'
                    }
                    return language === 'Tagalog' ? preset.nameTl : preset.name
                  })()

                return (
                  <View key={item.id || `${item.timestamp}-${index}`} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{item.date}</Text>
                    <Text style={styles.tableCell}>{item.time}</Text>
                    <Text style={styles.tableCell}>{typeLabel}</Text>
                  </View>
                )
              })
            ) : (
              <Text style={styles.emptyState}>{t.noHistory}</Text>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 32,
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: 40,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  backgroundOrbBottom: {
    position: 'absolute',
    right: -50,
    bottom: 80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  container: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  langButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  langButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  langButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  langButtonTextActive: {
    color: '#ffffff',
  },
  title: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 18,
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6366f1',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  stageText: {
    minHeight: 56,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 8,
  },
  presetLabel: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  presetChipActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  presetChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 15,
    fontWeight: '700',
  },
  historyCard: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#ffffff',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
    fontSize: 13,
    color: '#334155',
  },
  emptyState: {
    paddingVertical: 20,
    textAlign: 'center',
    color: '#94a3b8',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#c7d2fe',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
})