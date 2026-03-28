import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
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

const ENTRY_TYPES = ['heart', 'leaf', 'fish']

const getRandomEntryType = () => {
  return ENTRY_TYPES[Math.floor(Math.random() * ENTRY_TYPES.length)]
}

const getEntryIcon = type => {
  if (type === 'heart') {
    return '❤️'
  }

  if (type === 'leaf') {
    return '🍃'
  }

  return '🐟'
}

const createRotation = index => {
  const values = [-12, -8, -4, 4, 8, 12]
  return values[index % values.length]
}

export default function DiaryScreen({ navigation }) {
  const authState = useSelector(selectUser)
  const user = authState?.user ?? authState

  const [entry, setEntry] = useState('')
  const [entries, setEntries] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [user?.id, user?.user_id, user?.userId])

  const loadEntries = async () => {
    try {
      setIsLoading(true)
      const response = await axiosInstance.get('/activities')
      const activities = response.data?.activities || []

      const diaryHistory = activities
        .filter(activity => activity.activity_type === 'diary')
        .map(activity => ({
          id: activity.id,
          ...activity.data,
          timestamp: activity.created_at || activity.data?.timestamp,
        }))
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

      setEntries(diaryHistory)
    } catch (error) {
      console.error('Failed to load diary entries', error)
      Alert.alert('Load failed', 'Failed to load diary entries.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!entry.trim()) {
      return
    }

    const now = new Date()
    const newEntry = {
      text: entry.trim(),
      date: now.toLocaleString(),
      type: getRandomEntryType(),
      timestamp: now.toISOString(),
    }

    try {
      setIsSaving(true)
      await axiosInstance.post('/activities/save', {
        activityType: 'diary',
        data: newEntry,
      })
      await loadEntries()
      setEntry('')
    } catch (error) {
      console.error('Failed to save diary entry', error)
      Alert.alert('Save failed', 'Failed to save diary entry.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEntryPress = selected => {
    setSelectedEntry(selected)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setSelectedEntry(null)
  }

  const deleteEntry = id => {
    Alert.alert('Delete entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedEntries = entries.filter(item => item.id !== id)
          setEntries(updatedEntries)
          closeModal()
        },
      },
    ])
  }

  const clearAllEntries = () => {
    Alert.alert('Clear diary', 'Are you sure you want to clear all diary entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          setEntries([])
          closeModal()
        },
      },
    ])
  }

  const recentEntries = useMemo(() => entries.slice(0, 3), [entries])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>🫙</Text>
            <Text style={styles.headerTitle}>Diary Jar</Text>
          </View>

          {entries.length > 0 ? (
            <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={clearAllEntries}>
              <Ionicons name="trash-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButtonSpacer} />
          )}
        </View>

        <Text style={styles.subtitle}>Take a moment to reflect on every day.</Text>

        <View style={styles.jarCard}>
          <View style={styles.jarGlow} />
          <View style={styles.jarBody}>
            <View style={styles.jarLid} />
            <View style={styles.jarGlass}>
              <Text style={styles.jarLabel}>Your Memory Jar</Text>

              <View style={styles.iconCloud}>
                {entries.length === 0 ? (
                  <Text style={styles.emptyJarText}>Your memories will appear here.</Text>
                ) : (
                  entries.slice(0, 12).map((item, index) => (
                    <TouchableOpacity
                      key={item.id || index}
                      onPress={() => handleEntryPress(item)}
                      style={[
                        styles.floatingIcon,
                        { transform: [{ rotate: `${createRotation(index)}deg` }] },
                      ]}
                    >
                      <Text style={styles.floatingIconText}>{getEntryIcon(item.type)}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>

        {entries.length > 0 ? (
          <Text style={styles.counterText}>
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'} in your jar
          </Text>
        ) : null}

        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>What is on your mind today?</Text>
          <TextInput
            multiline
            placeholder="Write your thoughts here..."
            placeholderTextColor="#94a3b8"
            value={entry}
            onChangeText={setEntry}
            style={styles.input}
            textAlignVertical="top"
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={!entry.trim() || isSaving}
            style={[styles.primaryButton, !entry.trim() || isSaving ? styles.primaryButtonDisabled : null]}
          >
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Drop into Jar'}</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading memories...</Text>
          </View>
        ) : null}

        {!isLoading && entries.length > 0 ? (
          <View style={styles.recentCard}>
            <Text style={styles.recentTitle}>Recent Memories</Text>

            {recentEntries.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.recentItem}
                onPress={() => handleEntryPress(item)}
              >
                <Text style={styles.recentIcon}>{getEntryIcon(item.type)}</Text>
                <View style={styles.recentContent}>
                  <Text numberOfLines={1} style={styles.recentText}>
                    {item.text}
                  </Text>
                  <Text style={styles.recentDate}>{item.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>

            {selectedEntry ? (
              <>
                <Text style={styles.modalEmoji}>{getEntryIcon(selectedEntry.type)}</Text>
                <Text style={styles.modalTitle}>Memory from your Jar</Text>
                <Text style={styles.modalDate}>{selectedEntry.date}</Text>

                <View style={styles.modalBody}>
                  <Text style={styles.modalText}>{selectedEntry.text}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                    <Text style={styles.secondaryButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={() => deleteEntry(selectedEntry.id)}
                  >
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
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
    top: 24,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  backgroundOrbBottom: {
    position: 'absolute',
    right: -60,
    bottom: 80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  container: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 32,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  headerEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4f46e5',
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  iconButtonSpacer: {
    width: 44,
  },
  jarCard: {
    marginBottom: 18,
    borderRadius: 28,
    backgroundColor: 'rgba(248,250,252,0.9)',
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  jarGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(165, 180, 252, 0.18)',
    alignSelf: 'center',
    top: 40,
  },
  jarBody: {
    alignItems: 'center',
  },
  jarLid: {
    width: 124,
    height: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: '#d97706',
  },
  jarGlass: {
    width: '100%',
    minHeight: 260,
    marginTop: -2,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  jarLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 18,
  },
  iconCloud: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  floatingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingIconText: {
    fontSize: 24,
  },
  emptyJarText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  counterText: {
    textAlign: 'center',
    color: '#6366f1',
    fontWeight: '700',
    marginBottom: 18,
  },
  inputCard: {
    backgroundColor: 'rgba(248,250,252,0.95)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  input: {
    minHeight: 132,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 14,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  primaryButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  recentDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  modalEmoji: {
    textAlign: 'center',
    fontSize: 48,
    marginBottom: 10,
    marginTop: 8,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  modalDate: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 16,
  },
  modalBody: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  modalText: {
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 26,
    color: '#334155',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  modalDeleteButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
})