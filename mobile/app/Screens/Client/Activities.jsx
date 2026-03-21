import React from 'react'
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const activityGroups = [
  {
    title: 'Mind and Mood',
    subtitle: 'Daily support tools adapted from the frontend activities page.',
    items: [
      {
        id: 'clipcard',
        name: 'Clipcard Game',
        description: 'Test your memory with matching cards and light mental stimulation.',
        icon: 'game-controller-outline',
        accent: '#0f766e',
      },
      {
        id: 'diary',
        name: 'Diary',
        description: 'Write and revisit your daily thoughts in one place.',
        icon: 'book-outline',
        accent: '#8b5cf6',
      },
      {
        id: 'mood-tracker',
        name: 'Mood Tracker',
        description: 'Track your mood and reflect on emotional changes over time.',
        icon: 'happy-outline',
        accent: '#2563eb',
      },
    ],
  },
  {
    title: 'Recovery and Routine',
    subtitle: 'Wellness activities prepared for mobile-native flows.',
    items: [
      {
        id: 'sleep-tracker',
        name: 'Sleep Tracker',
        description: 'Monitor sleep habits and spot patterns that affect recovery.',
        icon: 'moon-outline',
        accent: '#1d4ed8',
      },
      {
        id: 'weekly-report',
        name: 'Weekly Wellness Report',
        description: 'Review your week across mood, sleep, and breathing progress.',
        icon: 'bar-chart-outline',
        accent: '#f97316',
      },
      {
        id: 'take-a-breath',
        name: 'Take a Breath',
        description: 'Use guided breathing exercises to reset during stressful moments.',
        icon: 'leaf-outline',
        accent: '#16a34a',
      },
      {
        id: 'medication-history',
        name: 'Medication History',
        description: 'Keep a simple record of medication routines and past entries.',
        icon: 'medkit-outline',
        accent: '#dc2626',
      },
    ],
  },
]

export default function ActivitiesScreen({ navigation }) {
  const handleActivityPress = activity => {
    if (activity.id === 'clipcard') {
      navigation.getParent?.()?.navigate('ClipCardGame') ||
        navigation.navigate('ClipCardGame')
      return
    }

    if (activity.id === 'diary') {
      navigation.getParent?.()?.navigate('Diary') || navigation.navigate('Diary')
      return
    }

    if (activity.id === 'mood-tracker') {
      navigation.getParent?.()?.navigate('MoodTracker') ||
        navigation.navigate('MoodTracker')
      return
    }

    if (activity.id === 'sleep-tracker') {
      navigation.getParent?.()?.navigate('SleepTracker') ||
        navigation.navigate('SleepTracker')
      return
    }

    if (activity.id === 'take-a-breath') {
      navigation.getParent?.()?.navigate('TakeABreath') ||
        navigation.navigate('TakeABreath')
      return
    }

    if (activity.id === 'weekly-report') {
      navigation.getParent?.()?.navigate('WeeklyWellnessReport') ||
        navigation.navigate('WeeklyWellnessReport')
      return
    }

    if (activity.id === 'medication-history') {
      navigation.getParent?.()?.navigate('MedicationHistory') ||
        navigation.navigate('MedicationHistory')
      return
    }

    Alert.alert(
      activity.name,
      'This activity hub has been converted for mobile. The detailed screen for this activity is not wired yet in the mobile app.',
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-5 pt-16 pb-10">
        <View className="rounded-[28px] bg-white border border-gray-100 px-6 py-7 mb-8 overflow-hidden shadow-sm">
          <View className="absolute top-0 right-0 w-40 h-40 rounded-full bg-indigo-100" />
          <View className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-100" />

          <View className="w-14 h-14 rounded-2xl bg-purple-50 items-center justify-center mb-5">
            <Ionicons name="grid-outline" size={28} color="#667eea" />
          </View>

          <Text className="text-gray-900 text-4xl font-bold mb-3">Activities</Text>
          <Text className="text-gray-600 text-base leading-6 mb-6">
            Explore the wellness tools from the frontend experience in a mobile-friendly hub.
          </Text>

          <View className="flex-row flex-wrap gap-3">
            <View className="px-4 py-2 rounded-full bg-purple-50 border border-purple-100">
              <Text className="text-indigo-500 text-xs font-semibold">7 activities</Text>
            </View>
            <View className="px-4 py-2 rounded-full bg-purple-50 border border-purple-100">
              <Text className="text-indigo-500 text-xs font-semibold">Mobile hub ready</Text>
            </View>
          </View>
        </View>

        {activityGroups.map(group => (
          <View key={group.title} className="mb-8">
            <Text className="text-gray-900 text-2xl font-bold mb-2">{group.title}</Text>
            <Text className="text-gray-600 text-sm leading-5 mb-4">
              {group.subtitle}
            </Text>

            <View className="gap-4">
              {group.items.map(activity => (
                <TouchableOpacity
                  key={activity.id}
                  activeOpacity={0.9}
                  onPress={() => handleActivityPress(activity)}
                  className="rounded-[24px] border border-gray-100 bg-white px-5 py-5 shadow-sm"
                >
                  <View className="flex-row items-start justify-between gap-4">
                    <View className="flex-1 pr-2">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
                        style={{ backgroundColor: activity.accent }}
                      >
                        <Ionicons name={activity.icon} size={24} color="#ffffff" />
                      </View>

                      <Text className="text-gray-900 text-xl font-semibold mb-2">
                        {activity.name}
                      </Text>
                      <Text className="text-gray-600 text-sm leading-6 mb-4">
                        {activity.description}
                      </Text>

                      <View className="self-start rounded-full border border-indigo-100 bg-purple-50 px-3 py-1.5">
                        <Text className="text-indigo-500 text-xs font-semibold">
                          Open details
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={22} color="#6366f1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}