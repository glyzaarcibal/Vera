import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSelector } from 'react-redux'

import axiosInstance from '../../../utils/axios.instance'
import { selectUser } from '../../../store/slices/authSelectors'

export default function MedicationHistory({ navigation }) {
  const authState = useSelector(selectUser)
  const user = authState?.user ?? authState

  const [medicationName, setMedicationName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('')
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [user?.id, user?.user_id, user?.userId])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/activities')
      const activities = response.data?.activities || []

      const medHistory = activities
        .filter(activity => activity.activity_type === 'medication')
        .map(activity => ({
          id: activity.id,
          ...activity.data,
          timestamp: activity.created_at || activity.data?.timestamp,
        }))
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

      setHistory(medHistory)
    } catch (error) {
      console.error('Failed to load medication history', error)
      Alert.alert('Load failed', 'Failed to load medication history.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!medicationName.trim()) {
      return
    }

    const newEntry = {
      name: medicationName.trim(),
      dosage: dosage.trim(),
      time: time.trim(),
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
    }

    try {
      setIsLoading(true)
      await axiosInstance.post('/activities/save', {
        activityType: 'medication',
        data: newEntry,
      })

      setMedicationName('')
      setDosage('')
      setTime('')
      await loadHistory()
    } catch (error) {
      console.error('Failed to save medication', error)
      Alert.alert('Save failed', 'Failed to save medication entry.')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = id => {
    Alert.alert('Delete entry', 'Delete this entry from current view?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setHistory(currentHistory => currentHistory.filter(item => item.id !== id))
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.title}>Medication History</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Log Medication</Text>

          <Text style={styles.inputLabel}>Medication Name</Text>
          <TextInput
            value={medicationName}
            onChangeText={setMedicationName}
            placeholder="e.g. Paracetamol"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Dosage</Text>
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 500mg"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Time Taken</Text>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 08:30"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !medicationName.trim()}
            style={[styles.primaryButton, isLoading || !medicationName.trim() ? styles.primaryButtonDisabled : null]}
          >
            <Text style={styles.primaryButtonText}>{isLoading ? 'Saving...' : 'Add to History'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Past Entries</Text>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : history.length === 0 ? (
            <Text style={styles.emptyState}>No medication history found.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map(item => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyName}>{item.name}</Text>
                    <Text style={styles.historyMeta}>
                      {item.dosage || '-'} {item.time ? `at ${item.time}` : ''}
                    </Text>
                    <Text style={styles.historyDate}>
                      {item.date || new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
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
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#4f46e5',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#0f172a',
  },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  loadingWrap: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyState: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14,
    fontStyle: 'italic',
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    padding: 12,
  },
  historyContent: {
    flex: 1,
    paddingRight: 8,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
})