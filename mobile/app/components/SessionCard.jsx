import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import RiskBadge from './RiskBadge'

const SessionCard = ({ session, onPress, navigation }) => {
  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = dateString => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSessionIcon = type => {
    return type === 'voice' ? 'mic' : 'chatbubble-ellipses'
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-5 shadow-sm mb-4 active:opacity-70"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View
            className={`w-10 h-10 rounded-lg items-center justify-center ${
              session.session_type === 'voice' ? 'bg-purple-100' : 'bg-blue-100'
            }`}
          >
            <Ionicons
              name={getSessionIcon(session.session_type)}
              size={20}
              color={session.session_type === 'voice' ? '#9333ea' : '#3b82f6'}
            />
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-800 capitalize">
              {session.session_type} Session
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(session.created_at)}
            </Text>
          </View>
        </View>
        <RiskBadge level={session.risk_level} size="sm" />
      </View>

      {/* Risk Score */}
      {session.risk_score != null && (
        <View className="bg-gray-50 rounded-lg p-3 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-600 font-medium">
              Risk Score
            </Text>
            <Text className="text-xl font-bold text-gray-800">
              {session.risk_score}
              <Text className="text-sm text-gray-500">/100</Text>
            </Text>
          </View>
        </View>
      )}

      {/* Session Details */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text className="text-xs text-gray-600">
            {formatTime(session.created_at)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="document-text-outline" size={16} color="#6b7280" />
          <Text className="text-xs text-gray-600">ID: {session.id}</Text>
        </View>
      </View>
    </Pressable>
  )
}

export default SessionCard
