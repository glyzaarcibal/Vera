import { View, Text, Pressable, Modal } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const DailyMoodModal = ({ visible, onClose, onSave }) => {
  const [selectedMood, setSelectedMood] = useState(null)

  const moods = [
    { id: 1, icon: 'sad-outline', label: 'Very Sad', color: '#ef4444' },
    { id: 2, icon: 'sad', label: 'Sad', color: '#f97316' },
    { id: 3, icon: 'remove-outline', label: 'Neutral', color: '#eab308' },
    { id: 4, icon: 'happy-outline', label: 'Happy', color: '#84cc16' },
    { id: 5, icon: 'happy', label: 'Very Happy', color: '#22c55e' },
  ]

  const handleSave = () => {
    if (selectedMood) {
      onSave(selectedMood)
      setSelectedMood(null)
    }
  }

  const handleClose = () => {
    setSelectedMood(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end px-5 pb-5">
        <View className="bg-white rounded-3xl w-full max-w-[400px] p-8 shadow-2xl">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-purple-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="heart" size={32} color="#667eea" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Daily Mood Tracking
            </Text>
            <Text className="text-base text-gray-600 text-center">
              How are you feeling today?
            </Text>
          </View>

          {/* Mood Selection */}
          <View className="mb-8">
            <View className="flex-row justify-between mb-6">
              {moods.map(mood => (
                <Pressable
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  style={{ alignItems: 'center' }}
                >
                  <View
                    className={`w-14 h-14 rounded-2xl items-center justify-center mb-2 ${
                      selectedMood === mood.id ? 'bg-purple-50' : 'bg-gray-50'
                    }`}
                    style={
                      selectedMood === mood.id
                        ? {
                            shadowColor: '#667eea',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                          }
                        : {}
                    }
                  >
                    <Ionicons
                      name={mood.icon}
                      size={28}
                      color={selectedMood === mood.id ? '#667eea' : mood.color}
                    />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Mood Labels */}
            {selectedMood && (
              <View className="items-center py-3 px-4 bg-purple-50 rounded-xl">
                <Text className="text-base font-semibold text-indigo-500">
                  {moods.find(m => m.id === selectedMood)?.label}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleSave}
              disabled={!selectedMood}
              className={`${!selectedMood ? 'opacity-50' : ''}`}
            >
              <View className="px-8 py-3.5 bg-white border-2 border-indigo-500 rounded-xl">
                <Text className="text-indigo-500 text-base font-semibold text-center">
                  Save Mood
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleClose}
              className="py-4 bg-gray-100 rounded-xl"
            >
              <Text className="text-gray-600 text-base font-medium text-center">
                Skip for now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default DailyMoodModal
