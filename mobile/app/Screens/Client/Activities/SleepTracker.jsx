import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'

import axiosInstance from '../../../utils/axios.instance'
import { selectUser } from '../../../store/slices/authSelectors'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const generateHourOptions = () =>
  Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))

const generateMinuteOptions = () => ['00', '15', '30', '45']

const getTodayValue = () => new Date().toISOString().split('T')[0].replace(/-/g, '/')

const sanitizePdfText = value =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function TimePickerRow({
  label,
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  isCompact,
  isVeryCompact,
}) {
  const pickerMode = Platform.OS === 'android' ? 'dialog' : 'dialog'
  const hourOptions = generateHourOptions()
  const minuteOptions = generateMinuteOptions()
  const periodOptions = ['AM', 'PM']

  const normalizedHour = String(hour ?? '')
  const normalizedMinute = String(minute ?? '')
  const normalizedPeriod = String(period ?? '')

  const safeHour = hourOptions.includes(normalizedHour)
    ? normalizedHour
    : hourOptions[0]
  const safeMinute = minuteOptions.includes(normalizedMinute)
    ? normalizedMinute
    : minuteOptions[0]
  const safePeriod = periodOptions.includes(normalizedPeriod)
    ? normalizedPeriod
    : periodOptions[0]

  return (
    <View style={styles.timeBlock}>
      <Text style={[styles.fieldLabel, isCompact ? styles.fieldLabelCompact : null]}>{label}</Text>
      <Text style={styles.selectedTimePreview}>{`${safeHour}:${safeMinute} ${safePeriod}`}</Text>
      <View style={[styles.pickerRow, isVeryCompact ? styles.pickerRowWrap : null]}>
        <View
          style={[
            styles.pickerShell,
            isCompact ? styles.pickerShellCompact : null,
            isVeryCompact ? styles.pickerShellVeryCompact : null,
          ]}
        >
          <View style={styles.pickerValueOverlay} pointerEvents="none">
            <Text style={styles.pickerValueText}>{safeHour}</Text>
            <Ionicons name="chevron-down" size={18} color="#475569" />
          </View>
          <Picker
            selectedValue={safeHour}
            onValueChange={value => onHourChange(String(value))}
            style={styles.pickerHidden}
            mode={pickerMode}
            dropdownIconColor="#475569"
          >
            {hourOptions.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>

        <View
          style={[
            styles.pickerShell,
            isCompact ? styles.pickerShellCompact : null,
            isVeryCompact ? styles.pickerShellVeryCompact : null,
          ]}
        >
          <View style={styles.pickerValueOverlay} pointerEvents="none">
            <Text style={styles.pickerValueText}>{safeMinute}</Text>
            <Ionicons name="chevron-down" size={18} color="#475569" />
          </View>
          <Picker
            selectedValue={safeMinute}
            onValueChange={value => onMinuteChange(String(value))}
            style={styles.pickerHidden}
            mode={pickerMode}
            dropdownIconColor="#475569"
          >
            {minuteOptions.map(option => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>

        <View
          style={[
            styles.pickerShell,
            isCompact ? styles.pickerShellCompact : null,
            isVeryCompact ? styles.pickerShellVeryCompact : null,
          ]}
        >
          <View style={styles.pickerValueOverlay} pointerEvents="none">
            <Text style={styles.pickerValueText}>{safePeriod}</Text>
            <Ionicons name="chevron-down" size={18} color="#475569" />
          </View>
          <Picker
            selectedValue={safePeriod}
            onValueChange={value => onPeriodChange(String(value))}
            style={styles.pickerHidden}
            mode={pickerMode}
            dropdownIconColor="#475569"
          >
            <Picker.Item label="AM" value="AM" />
            <Picker.Item label="PM" value="PM" />
          </Picker>
        </View>
      </View>
    </View>
  )
}

function CalendarPicker({
  selectedDate,
  currentMonth,
  onMonthChange,
  onDateSelect,
  isCompact,
}) {
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate()

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay()

  const cells = []

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(<View key={`empty-${index}`} style={styles.calendarEmptyCell} />)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`
    const isSelected = dateValue === selectedDate

    cells.push(
      <TouchableOpacity
        key={dateValue}
        onPress={() => onDateSelect(dateValue)}
        style={[styles.calendarCell, isSelected ? styles.calendarCellSelected : null]}
      >
        <Text style={[styles.calendarCellText, isSelected ? styles.calendarCellTextSelected : null]}>
          {day}
        </Text>
      </TouchableOpacity>,
    )
  }

  return (
    <View style={[styles.calendarCard, isCompact ? styles.calendarCardCompact : null]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={() => onMonthChange(-1)}
          style={[styles.calendarNavButton, isCompact ? styles.calendarNavButtonCompact : null]}
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </TouchableOpacity>

        <Text style={[styles.calendarHeaderText, isCompact ? styles.calendarHeaderTextCompact : null]}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={() => onMonthChange(1)}
          style={[styles.calendarNavButton, isCompact ? styles.calendarNavButtonCompact : null]}
        >
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarWeekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} style={[styles.calendarWeekDay, isCompact ? styles.calendarWeekDayCompact : null]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>{cells}</View>
    </View>
  )
}

export default function SleepTracker({ navigation, onUpdateReport = () => {} }) {
    const { width: screenWidth } = useWindowDimensions()
    const isCompact = screenWidth < 390
    const isVeryCompact = screenWidth < 350

  const authState = useSelector(selectUser)
  const user = authState?.user ?? authState
  const userId = user?.id ?? user?.user_id ?? user?.userId

  const [selectedDate, setSelectedDate] = useState(getTodayValue())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [sleepHour, setSleepHour] = useState('10')
  const [sleepMinute, setSleepMinute] = useState('00')
  const [sleepPeriod, setSleepPeriod] = useState('PM')
  const [wakeHour, setWakeHour] = useState('06')
  const [wakeMinute, setWakeMinute] = useState('00')
  const [wakePeriod, setWakePeriod] = useState('AM')

  const [sleepData, setSleepData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSleepData()
  }, [user?.id, user?.user_id, user?.userId])

  const loadSleepData = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/activities')
      const activities = response.data?.activities || []

      const history = activities
        .filter(activity => activity.activity_type === 'sleep')
        .map(activity => ({
          id: activity.id,
          ...activity.data,
        }))
        .sort((left, right) => {
          const leftDate = new Date(left.timestamp || left.date)
          const rightDate = new Date(right.timestamp || right.date)
          return rightDate - leftDate
        })

      setSleepData(history)
    } catch (error) {
      console.error('Error loading sleep history:', error)
      Alert.alert('Load failed', 'Failed to load sleep history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = useMemo(() => {
    const parseTime = (hour, minute, period) => {
      let parsedHour = parseInt(hour, 10)
      const parsedMinute = parseInt(minute, 10)

      if (period === 'PM' && parsedHour !== 12) {
        parsedHour += 12
      }

      if (period === 'AM' && parsedHour === 12) {
        parsedHour = 0
      }

      return parsedHour * 60 + parsedMinute
    }

    let sleepMinutes = parseTime(sleepHour, sleepMinute, sleepPeriod)
    let wakeMinutes = parseTime(wakeHour, wakeMinute, wakePeriod)

    if (wakeMinutes < sleepMinutes) {
      wakeMinutes += 24 * 60
    }

    const durationMinutes = wakeMinutes - sleepMinutes
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    return `${hours}h ${minutes}m`
  }, [sleepHour, sleepMinute, sleepPeriod, wakeHour, wakeMinute, wakePeriod])

  const saveSleepData = async () => {
    try {
      setSaving(true)

      const newEntry = {
        date: selectedDate.replace(/\//g, '-'),
        sleep_time: `${sleepHour}:${sleepMinute} ${sleepPeriod}`,
        wake_time: `${wakeHour}:${wakeMinute} ${wakePeriod}`,
        duration: calculateDuration,
        timestamp: new Date().toISOString(),
      }

      console.log('Saving sleep data:', { activityType: 'sleep', data: newEntry })
      const response = await axiosInstance.post('/activities/save', {
        activityType: 'sleep',
        data: newEntry,
      })

      console.log('Save response:', response.data)
      await loadSleepData()
      onUpdateReport()
      Alert.alert('Saved', 'Sleep data saved successfully.')
    } catch (error) {
      console.error('Error saving sleep data:', error.response?.data || error.message)
      Alert.alert('Save failed', error.response?.data?.message || 'Failed to save sleep data.')
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = id => {
    Alert.alert(
      'Delete entry',
      'Delete this sleep entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) {
              Alert.alert('Delete failed', 'Unable to delete this entry.')
              return
            }

            try {
              setLoading(true)
              await axiosInstance.delete(`/activities/${id}`)

              const updatedHistory = sleepData.filter(entry => entry.id !== id)
              setSleepData(updatedHistory)
              onUpdateReport(updatedHistory)
            } catch (error) {
              console.error('Error deleting sleep data:', error.response?.data || error.message)
              Alert.alert(
                'Delete failed',
                error.response?.data?.message || 'Failed to delete sleep entry.',
              )
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }

  const sleepStats = useMemo(() => {
    if (sleepData.length === 0) {
      return { totalHours: 0, averageHours: 0, totalNights: 0 }
    }

    const parseTime = (timeStr, period) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      let h = hours
      if (period === 'PM' && h !== 12) h += 12
      if (period === 'AM' && h === 12) h = 0
      return h * 60 + minutes
    }

    let totalMinutes = 0
    sleepData.forEach(entry => {
      const sleepMatch = entry.sleep_time?.match(/(\d+):(\d+)\s(AM|PM)/)
      const wakeMatch = entry.wake_time?.match(/(\d+):(\d+)\s(AM|PM)/)
      if (sleepMatch && wakeMatch) {
        let sleepMins = parseTime(`${sleepMatch[1]}:${sleepMatch[2]}`, sleepMatch[3])
        let wakeMins = parseTime(`${wakeMatch[1]}:${wakeMatch[2]}`, wakeMatch[3])
        if (wakeMins < sleepMins) wakeMins += 24 * 60
        totalMinutes += wakeMins - sleepMins
      }
    })

    const totalHours = (totalMinutes / 60).toFixed(1)
    const averageHours = (totalMinutes / sleepData.length / 60).toFixed(1)

    return {
      totalHours: parseFloat(totalHours),
      averageHours: parseFloat(averageHours),
      totalNights: sleepData.length,
    }
  }, [sleepData])

  const exportSleepHistoryPdf = async () => {
    if (sleepData.length === 0) {
      Alert.alert('No data', 'No sleep history to export.')
      return
    }

    try {
      const statsRows = `
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1;">Total Nights</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">${sleepStats.totalNights}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1;">Total Sleep Hours</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">${sleepStats.totalHours.toFixed(1)}h</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1;">Average Per Night</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">${sleepStats.averageHours.toFixed(1)}h</td>
        </tr>
      `

      const historyRows = sleepData
        .slice(0, 50)
        .map(
          entry => `
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sanitizePdfText(entry.date)}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sanitizePdfText(entry.sleep_time)}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1;">${sanitizePdfText(entry.wake_time)}</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">${sanitizePdfText(entry.duration)}</td>
          </tr>
        `,
        )
        .join('')

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
              h1 { color: #4f46e5; margin-bottom: 10px; }
              h2 { color: #334155; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
              .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #4f46e5; font-weight: bold; margin-bottom: 14px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
              th { background-color: #eef2ff; color: #4f46e5; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
              td { padding: 10px; border: 1px solid #cbd5e1; }
            </style>
          </head>
          <body>
            <h1>Sleep Tracker Report</h1>
            <div class="badge">Generated: ${new Date().toLocaleDateString()}</div>
            <h2>Sleep Statistics</h2>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style="text-align: right;">Value</th>
                </tr>
              </thead>
              <tbody>${statsRows}</tbody>
            </table>
            <h2>Sleep History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sleep Time</th>
                  <th>Wake Time</th>
                  <th style="text-align: right;">Duration</th>
                </tr>
              </thead>
              <tbody>${historyRows}</tbody>
            </table>
          </body>
        </html>
      `

      const pdf = await Print.printToFileAsync({
        html,
        base64: false,
      })

      const canShare = await Sharing.isAvailableAsync()
      if (!canShare) {
        Alert.alert('PDF created', `Saved PDF file: ${pdf.uri}`)
        return
      }

      await Sharing.shareAsync(pdf.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Sleep History',
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      Alert.alert('Export failed', 'Failed to generate PDF.')
    }
  }

  const handleMonthChange = increment => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + increment)
    setCurrentMonth(nextMonth)
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.contentContainer, isCompact ? styles.contentContainerCompact : null]}
    >
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={[styles.container, isCompact ? styles.containerCompact : null]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.pageTitle, isCompact ? styles.pageTitleCompact : null]}>Sleep Tracker</Text>

        <View style={[styles.formCard, isCompact ? styles.formCardCompact : null]}>
          <Text style={[styles.selectedDateText, isCompact ? styles.selectedDateTextCompact : null]}>
            Selected Date: {selectedDate}
          </Text>

          <CalendarPicker
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            onDateSelect={setSelectedDate}
            isCompact={isCompact}
          />

          <TimePickerRow
            label="Sleep Time"
            hour={sleepHour}
            minute={sleepMinute}
            period={sleepPeriod}
            onHourChange={setSleepHour}
            onMinuteChange={setSleepMinute}
            onPeriodChange={setSleepPeriod}
            isCompact={isCompact}
            isVeryCompact={isVeryCompact}
          />

          <TimePickerRow
            label="Wake Time"
            hour={wakeHour}
            minute={wakeMinute}
            period={wakePeriod}
            onHourChange={setWakeHour}
            onMinuteChange={setWakeMinute}
            onPeriodChange={setWakePeriod}
            isCompact={isCompact}
            isVeryCompact={isVeryCompact}
          />

          <Text style={[styles.durationText, isCompact ? styles.durationTextCompact : null]}>
            Sleep Duration: {calculateDuration}
          </Text>

          <TouchableOpacity
            onPress={saveSleepData}
            style={[
              styles.saveButton,
              isCompact ? styles.saveButtonCompact : null,
              saving ? styles.saveButtonDisabled : null,
            ]}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, isCompact ? styles.saveButtonTextCompact : null]}>
              {saving ? 'Saving...' : 'Save Sleep Data'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, isCompact ? styles.statsCardCompact : null]}>
          <Text style={[styles.statsTitle, isCompact ? styles.statsTitleCompact : null]}>Sleep Statistics</Text>
          <View style={[styles.statsGrid, isVeryCompact ? styles.statsGridWrap : null]}>
            <View style={[styles.statBox, isVeryCompact ? styles.statBoxWrap : null]}>
              <Text style={[styles.statValue, isCompact ? styles.statValueCompact : null]}>{sleepStats.totalNights}</Text>
              <Text style={styles.statLabel}>Nights Tracked</Text>
            </View>
            <View style={[styles.statBox, isVeryCompact ? styles.statBoxWrap : null]}>
              <Text style={[styles.statValue, isCompact ? styles.statValueCompact : null]}>{sleepStats.totalHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Total Sleep</Text>
            </View>
            <View style={[styles.statBox, isVeryCompact ? styles.statBoxWrap : null]}>
              <Text style={[styles.statValue, isCompact ? styles.statValueCompact : null]}>{sleepStats.averageHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
          </View>
        </View>

        <View style={[styles.historyCard, isCompact ? styles.historyCardCompact : null]}>
          <View style={[styles.historyHeader, isCompact ? styles.historyHeaderCompact : null]}>
            <Text style={[styles.historyTitle, isCompact ? styles.historyTitleCompact : null]}>Sleep History</Text>
            {sleepData.length > 0 && (
              <TouchableOpacity
                onPress={exportSleepHistoryPdf}
                style={[styles.exportButton, isCompact ? styles.exportButtonCompact : null]}
              >
                <Ionicons name="download-outline" size={18} color="#ffffff" />
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : sleepData.length > 0 ? (
            sleepData.map(entry => (
              <View key={entry.id} style={[styles.historyItem, isVeryCompact ? styles.historyItemCompact : null]}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyLine}>Sleep: {entry.sleep_time}</Text>
                  <Text style={styles.historyLine}>Wake: {entry.wake_time}</Text>
                  <Text style={styles.historyDuration}>{entry.duration}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => deleteEntry(entry.id)}
                  style={[styles.deleteButton, isVeryCompact ? styles.deleteButtonCompact : null]}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyText}>No sleep history found.</Text>
            </View>
          )}
        </View>
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
  contentContainerCompact: {
    paddingHorizontal: 14,
    paddingTop: 42,
    paddingBottom: 24,
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
  containerCompact: {
    borderRadius: 24,
    padding: 14,
  },
  headerRow: {
    marginBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4f46e5',
    textAlign: 'center',
    marginBottom: 20,
  },
  pageTitleCompact: {
    fontSize: 24,
    marginBottom: 14,
  },
  formCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  formCardCompact: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 14,
  },
  selectedDateTextCompact: {
    fontSize: 14,
    marginBottom: 10,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calendarCardCompact: {
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarNavButton: {
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  calendarHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  calendarHeaderTextCompact: {
    fontSize: 14,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekDay: {
    width: '14.28%',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarWeekDayCompact: {
    fontSize: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 6,
  },
  calendarCellSelected: {
    backgroundColor: '#66BB6A',
  },
  calendarCellText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  calendarCellTextSelected: {
    color: '#ffffff',
  },
  calendarEmptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  timeBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  fieldLabelCompact: {
    fontSize: 14,
    marginBottom: 6,
  },
  selectedTimePreview: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerRowWrap: {
    flexWrap: 'wrap',
    rowGap: 8,
  },
  pickerShell: {
    width: '31.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  pickerShellCompact: {
    borderRadius: 12,
  },
  pickerShellVeryCompact: {
    width: '32%',
  },
  pickerValueOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  picker: {
    height: 54,
    color: '#0f172a',
  },
  pickerHidden: {
    height: 54,
    opacity: 0.02,
  },
  pickerCompact: {
    height: 48,
  },
  durationText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  durationTextCompact: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonCompact: {
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  saveButtonTextCompact: {
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyCardCompact: {
    borderRadius: 18,
    padding: 12,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  historyTitleCompact: {
    fontSize: 18,
    marginBottom: 8,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyItemCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  historyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  historyLine: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 3,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
    marginTop: 3,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deleteButtonCompact: {
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  statsCardCompact: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  statsTitleCompact: {
    fontSize: 16,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsGridWrap: {
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statBoxWrap: {
    minWidth: '48%',
    flexBasis: '48%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 4,
  },
  statValueCompact: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyHeaderCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  exportButtonCompact: {
    alignSelf: 'flex-start',
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
})