import { View, Text } from 'react-native'
import React from 'react'

const RiskBadge = ({ level, size = 'md' }) => {
  const getRiskConfig = () => {
    switch (level?.toLowerCase()) {
      case 'low':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: 'Low',
        }
      case 'moderate':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: 'Moderate',
        }
      case 'high':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          label: 'High',
        }
      case 'critical':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Critical',
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: 'Not Assessed',
        }
    }
  }

  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const config = getRiskConfig()

  return (
    <View className={`${config.bg} rounded-lg ${sizeConfig[size]}`}>
      <Text className={`${config.text} font-semibold`}>{config.label}</Text>
    </View>
  )
}

export default RiskBadge
