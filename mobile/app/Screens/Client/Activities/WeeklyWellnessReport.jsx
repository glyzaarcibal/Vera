import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import axiosInstance from '../../../utils/axios.instance'
import { selectUser } from '../../../store/slices/authSelectors'

const BREATHING_TYPE_LABELS = {
  relaxing: 'Relaxing (6-7-8)',
  box: 'Box (4-4-4)',
  '478': '4-7-8 Calm',
  calm: 'Calm (4-2-6)',
}

const emotionColorMap = {
  'Very Sad': '#3B82F6',
  Sad: '#6366F1',
  Neutral: '#9CA3AF',
  Happy: '#FACC15',
  'Very Happy': '#F59E0B',
  Angry: '#EF4444',
  Anxious: '#FB923C',
  Tired: '#8D6E63',
  Relaxed: '#66BB6A',
  Calm: '#26A69A',
  Unknown: '#94A3B8',
}

const fallbackPalette = [
  '#EC4899',
  '#14B8A6',
  '#8B5CF6',
  '#06B6D4',
  '#EAB308',
  '#F97316',
  '#22C55E',
  '#0EA5E9',
]

const getEmotionColor = emotion => {
  if (emotionColorMap[emotion]) {
    return emotionColorMap[emotion]
  }

  const key = String(emotion || 'Unknown')
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = key.charCodeAt(index) + ((hash << 5) - hash)
  }

  return fallbackPalette[Math.abs(hash) % fallbackPalette.length]
}

const parseDurationToHours = duration => {
  if (typeof duration === 'number') {
    return duration
  }

  if (!duration || typeof duration !== 'string') {
    return 0
  }

  const hoursMatch = duration.match(/(\d+)\s*h/i)
  const minutesMatch = duration.match(/(\d+)\s*m/i)

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0

  return hours + minutes / 60
}

const getSleepMessage = duration => {
  if (duration >= 8 && duration <= 10) {
    return 'Good sleep: 8-10 hours is ideal. Keep it up!'
  }

  if (duration > 10) {
    return 'Oversleeping: More than 10 hours is not healthy. Try to maintain a balanced schedule.'
  }

  return 'Lack of sleep: Less than 8 hours is insufficient. Prioritize your rest for better health.'
}

const interpretBreathingData = count => {
  if (count === 0) {
    return 'Low relaxation activity. You may not have needed or practiced breathing exercises this week.'
  }
  if (count >= 1 && count <= 4) {
    return 'Moderate stress management. You are using breathing for occasional regulation.'
  }
  if (count >= 5 && count <= 7) {
    return 'High usage. This can indicate active stress management or a deliberate relaxation habit.'
  }
  return 'Very frequent sessions. If this reflects high stress, consider additional support strategies.'
}

const normalizeDateLabel = raw => {
  if (!raw) {
    return 'Unknown'
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return String(raw)
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function SectionCard({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function HorizontalBars({ data, valueKey = 'value', labelKey = 'name', colorKey = 'color' }) {
  if (!data.length) {
    return <Text style={styles.noDataText}>No data available.</Text>
  }

  const max = Math.max(...data.map(item => Number(item[valueKey]) || 0), 1)

  return (
    <View style={styles.barsWrap}>
      {data.map(item => {
        const value = Number(item[valueKey]) || 0
        const width = `${Math.max((value / max) * 100, 5)}%`

        return (
          <View key={`${item[labelKey]}-${value}`} style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel}>{item[labelKey]}</Text>
              <Text style={styles.barValue}>{value}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width,
                    backgroundColor: item[colorKey] || '#6366f1',
                  },
                ]}
              />
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default function WeeklyWellnessReport({ navigation }) {
  const authState = useSelector(selectUser)
  const user = authState?.user ?? authState

  const [isLoading, setIsLoading] = useState(true)
  const [moodCounts, setMoodCounts] = useState({})
  const [sleepData, setSleepData] = useState([])
  const [breathingData, setBreathingData] = useState({ byDay: {}, byType: {}, raw: [] })

  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({})

  useEffect(() => {
    fetchAllActivities()
  }, [user?.id, user?.user_id, user?.userId])

  const fetchAllActivities = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/activities')
      const activities = response.data?.activities || []
      processAllActivities(activities)
    } catch (error) {
      console.error('Error fetching activities:', error)
      Alert.alert('Load failed', 'Unable to fetch weekly report data at the moment.')
    } finally {
      setIsLoading(false)
    }
  }

  const processAllActivities = activities => {
    const moodScoreMap = {
      1: 'Very Sad',
      2: 'Sad',
      3: 'Neutral',
      4: 'Happy',
      5: 'Very Happy',
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const moodLogs = activities.filter(activity => activity.activity_type === 'mood')
    const counts = moodLogs.reduce((accumulator, log) => {
      const data = log.data || {}
      const logDate = data.timestamp || log.created_at || data.date

      if (logDate && new Date(logDate) < sevenDaysAgo) {
        return accumulator
      }

      const moodLabel =
        (typeof data.mood === 'string' && data.mood) ||
        (data.mood && typeof data.mood === 'object' && data.mood.mood) ||
        moodScoreMap[data.mood_score] ||
        data.moodEmoji ||
        'Unknown'

      accumulator[moodLabel] = (accumulator[moodLabel] || 0) + 1
      return accumulator
    }, {})
    setMoodCounts(counts)

    const sleepLogs = activities
      .filter(activity => activity.activity_type === 'sleep')
      .map(activity => ({
        id: activity.id,
        ...activity.data,
      }))
      .sort((left, right) => {
        const leftDate = new Date(left.date || left.timestamp)
        const rightDate = new Date(right.date || right.timestamp)
        return rightDate - leftDate
      })
    setSleepData(sleepLogs)

    const breathLogs = activities
      .filter(activity => activity.activity_type === 'breath')
      .map(activity => ({
        ...activity.data,
        type: activity.data?.type || 'relaxing',
        typeLabel:
          activity.data?.typeLabel ||
          BREATHING_TYPE_LABELS[activity.data?.type] ||
          'Relaxing (6-7-8)',
      }))
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

    const groupedByDay = {}
    const groupedByType = {}

    breathLogs.forEach(entry => {
      const date = entry.date || 'Unknown'
      groupedByDay[date] = (groupedByDay[date] || 0) + 1

      const label = entry.typeLabel || BREATHING_TYPE_LABELS[entry.type] || entry.type || 'Other'
      groupedByType[label] = (groupedByType[label] || 0) + 1
    })

    setBreathingData({
      byDay: groupedByDay,
      byType: groupedByType,
      raw: breathLogs,
    })
  }

  const sleepChartData = useMemo(() => {
    return sleepData.map(entry => {
      const totalHours = parseDurationToHours(entry.duration)
      const rawDate = (entry.date || entry.created_at || entry.timestamp || '').toString()

      return {
        id: entry.id,
        date: normalizeDateLabel(rawDate),
        fullDate: rawDate,
        duration: totalHours,
        sleepTime: entry.sleepTime || entry.sleep_time,
        wakeTime: entry.wakeTime || entry.wake_time,
      }
    })
  }, [sleepData])

  const pieData = useMemo(() => {
    return Object.keys(moodCounts).map(key => ({
      name: key,
      value: moodCounts[key],
      color: getEmotionColor(key),
    }))
  }, [moodCounts])

  const breathingChartData = useMemo(() => {
    return Object.keys(breathingData.byDay || {}).map(date => ({
      date,
      sessions: breathingData.byDay[date],
      color: '#6366f1',
    }))
  }, [breathingData])

  const breathingByTypeChartData = useMemo(() => {
    return Object.keys(breathingData.byType || {}).map(label => ({
      name: label,
      value: breathingData.byType[label],
      color: '#7c3aed',
    }))
  }, [breathingData])

  const analyzeSleepTrend = () => {
    if (sleepData.length < 6) {
      return 'Not enough data to analyze trends.'
    }

    let improving = 0
    let declining = 0

    for (let index = 1; index < sleepData.length; index += 1) {
      const previous = parseDurationToHours(sleepData[index - 1].duration)
      const current = parseDurationToHours(sleepData[index].duration)
      if (current > previous) {
        improving += 1
      } else if (current < previous) {
        declining += 1
      }
    }

    if (improving > declining) {
      return 'Your sleep is improving. Keep up the good habits.'
    }

    if (declining > improving) {
      return 'Your sleep is decreasing. Try to get more consistent rest.'
    }

    return 'Your sleep pattern is stable. Keep it within recommended hours.'
  }

  const showSleepDetails = entry => {
    setModalContent({
      date: entry.fullDate,
      sleepTime: entry.sleepTime,
      wakeTime: entry.wakeTime,
      duration: entry.duration.toFixed(1),
      message: getSleepMessage(entry.duration),
    })
    setShowModal(true)
  }

  const maxBreathingSessions = breathingChartData.length
    ? Math.max(...breathingChartData.map(item => item.sessions))
    : 0

  const exportPdfReport = async () => {
    try {
      const sharingAvailable = await Sharing.isAvailableAsync()
      if (!sharingAvailable) {
        Alert.alert('Share unavailable', 'Sharing is not available on this device.')
        return
      }

      const moodRows =
        pieData.length > 0
          ? pieData
              .map(item => `<tr><td>${item.name}</td><td>${item.value}</td></tr>`)
              .join('')
          : '<tr><td>No data</td><td>0</td></tr>'

      const sleepRows =
        sleepChartData.length > 0
          ? sleepChartData
              .map(
                item =>
                  `<tr><td>${item.fullDate || item.date}</td><td>${Number(item.duration || 0).toFixed(1)} h</td><td>${item.sleepTime || 'N/A'}</td><td>${item.wakeTime || 'N/A'}</td></tr>`,
              )
              .join('')
          : '<tr><td>No data</td><td>0.0 h</td><td>N/A</td><td>N/A</td></tr>'

      const breathRows =
        breathingChartData.length > 0
          ? breathingChartData
              .map(item => `<tr><td>${item.date}</td><td>${item.sessions}</td></tr>`)
              .join('')
          : '<tr><td>No data</td><td>0</td></tr>'

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
              h1 { text-align: center; color: #4f46e5; margin-bottom: 4px; }
              .meta { text-align: center; color: #6b7280; margin-bottom: 24px; font-size: 12px; }
              h2 { color: #374151; margin-top: 22px; margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
              th { background: #e0e7ff; color: #3730a3; }
              .insight { background: #eef2ff; border-radius: 8px; padding: 10px; font-size: 12px; color: #3730a3; }
            </style>
          </head>
          <body>
            <h1>Weekly Wellness Report</h1>
            <div class="meta">Generated on ${new Date().toLocaleString()}</div>

            <h2>Mood Distribution (Past 7 Days)</h2>
            <table>
              <thead><tr><th>Mood</th><th>Count</th></tr></thead>
              <tbody>${moodRows}</tbody>
            </table>

            <h2>Sleep Duration Report</h2>
            <table>
              <thead><tr><th>Date</th><th>Duration</th><th>Sleep Time</th><th>Wake Time</th></tr></thead>
              <tbody>${sleepRows}</tbody>
            </table>
            <div class="insight">Sleep trend: ${analyzeSleepTrend()}</div>

            <h2>Breathing Sessions Per Day</h2>
            <table>
              <thead><tr><th>Date</th><th>Sessions</th></tr></thead>
              <tbody>${breathRows}</tbody>
            </table>
            <div class="insight">Breathing insight: ${interpretBreathingData(maxBreathingSessions)}</div>
          </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Weekly Wellness Report',
        UTI: 'com.adobe.pdf',
      })
    } catch (error) {
      console.error('Failed to export PDF report:', error)
      Alert.alert('Export failed', 'Unable to generate PDF report right now.')
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#667eea" />
          </TouchableOpacity>

          <Text style={styles.title}>Weekly Wellness Report</Text>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={exportPdfReport}
          >
            <Text style={styles.downloadButtonText}>PDF</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading wellness report...</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            <SectionCard title="Mood Distribution (Past 7 Days)">
              <HorizontalBars data={pieData} valueKey="value" labelKey="name" colorKey="color" />
            </SectionCard>

            <SectionCard title="Sleep Duration Report">
              {sleepChartData.length > 0 ? (
                <View>
                  {sleepChartData.map(entry => (
                    <TouchableOpacity
                      key={entry.id || entry.fullDate}
                      style={styles.sleepRow}
                      onPress={() => showSleepDetails(entry)}
                    >
                      <View style={styles.sleepLeft}>
                        <Text style={styles.sleepDate}>{entry.date}</Text>
                        <Text style={styles.sleepMeta}>
                          {entry.sleepTime || 'N/A'} {'->'} {entry.wakeTime || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.sleepRight}>
                        <Text style={styles.sleepDuration}>{entry.duration.toFixed(1)}h</Text>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </View>
                    </TouchableOpacity>
                  ))}

                  <Text style={styles.trendText}>{analyzeSleepTrend()}</Text>
                </View>
              ) : (
                <Text style={styles.noDataText}>No sleep data available.</Text>
              )}
            </SectionCard>

            <SectionCard title="Breathing Sessions Per Day">
              <HorizontalBars data={breathingChartData} valueKey="sessions" labelKey="date" colorKey="color" />
              <Text style={styles.trendText}>{interpretBreathingData(maxBreathingSessions)}</Text>
            </SectionCard>

            {breathingByTypeChartData.length > 0 ? (
              <SectionCard title="Breathing Sessions by Type">
                <HorizontalBars data={breathingByTypeChartData} valueKey="value" labelKey="name" colorKey="color" />
              </SectionCard>
            ) : null}

            {breathingData.raw?.length > 0 ? (
              <SectionCard title="Recent Breathing History">
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Date</Text>
                  <Text style={styles.tableHeaderCell}>Time</Text>
                  <Text style={styles.tableHeaderCell}>Type</Text>
                </View>

                {breathingData.raw.slice(0, 10).map((entry, index) => (
                  <View key={`${entry.timestamp}-${index}`} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{entry.date || '-'}</Text>
                    <Text style={styles.tableCell}>{entry.time || '-'}</Text>
                    <Text style={styles.tableCell}>{entry.typeLabel || entry.type || '-'}</Text>
                  </View>
                ))}
              </SectionCard>
            ) : null}
          </View>
        )}
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sleep Details</Text>
            <Text style={styles.modalText}>Date: {modalContent.date}</Text>
            <Text style={styles.modalText}>Sleep Time: {modalContent.sleepTime}</Text>
            <Text style={styles.modalText}>Wake Time: {modalContent.wakeTime}</Text>
            <Text style={styles.modalText}>Duration: {modalContent.duration} hours</Text>
            <Text style={styles.modalText}>Analysis: {modalContent.message}</Text>
            <Text style={styles.modalQuote}>
              "Rest is the best investment for a productive tomorrow."
            </Text>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#4f46e5',
  },
  downloadButton: {
    borderRadius: 10,
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardsContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 12,
  },
  noDataText: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 8,
  },
  barsWrap: {
    gap: 10,
  },
  barRow: {
    gap: 5,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  barValue: {
    color: '#0f172a',
    fontWeight: '800',
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  sleepRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepLeft: {
    flex: 1,
    paddingRight: 8,
  },
  sleepDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  sleepMeta: {
    color: '#64748b',
    fontSize: 12,
  },
  sleepRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sleepDuration: {
    color: '#4f46e5',
    fontWeight: '800',
    fontSize: 14,
  },
  trendText: {
    marginTop: 12,
    backgroundColor: 'rgba(102,126,234,0.1)',
    borderRadius: 10,
    padding: 10,
    color: '#4f46e5',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(102,126,234,0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ff',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 12,
  },
  modalText: {
    color: '#334155',
    marginBottom: 6,
    lineHeight: 20,
  },
  modalQuote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    color: '#64748b',
    fontStyle: 'italic',
  },
  modalCloseButton: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: '#667eea',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
})