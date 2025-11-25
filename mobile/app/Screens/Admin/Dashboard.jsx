import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons'

const Dashboard = ({ navigation }) => {
  const name = useSelector(state => state.name.value)

  const stats = [
    { label: 'Total Users', value: '1,234', icon: 'people', change: '+12%' },
    {
      label: 'Active Sessions',
      value: '89',
      icon: 'check-circle',
      change: '+5%',
    },
    { label: 'API Calls Today', value: '15.2K', icon: 'wifi', change: '+23%' },
    {
      label: 'System Status',
      value: 'Healthy',
      icon: 'verified',
      change: '100%',
    },
  ]

  const recentActivity = [
    { user: 'john_doe', action: 'Logged in', time: '2 minutes ago' },
    { user: 'jane_smith', action: 'Updated profile', time: '15 minutes ago' },
    { user: 'admin', action: 'Created new user', time: '1 hour ago' },
    { user: 'alice_wonder', action: 'Changed password', time: '2 hours ago' },
    { user: 'bob_builder', action: 'Logged out', time: '3 hours ago' },
  ]

  const quickActions = [
    { label: 'Add User', icon: 'add' },
    { label: 'View Reports', icon: 'bar-chart' },
    { label: 'Settings', icon: 'settings' },
    { label: 'Notifications', icon: 'notifications' },
  ]

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Dashboard</Text>
        <Text className="text-base text-gray-600">
          Welcome back, {name}! Here's what's happening today.
        </Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-5 mb-8">
        {stats.map((stat, index) => (
          <View
            key={index}
            className="bg-white p-6 rounded-xl flex-1 min-w-[45%] flex-row items-center gap-4 shadow-sm"
          >
            <View className="w-16 h-16 bg-indigo-50 rounded-xl items-center justify-center">
              <Icon name={stat.icon} size={40} color="#667eea" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-400 mb-1">{stat.label}</Text>
              <Text className="text-3xl font-bold text-gray-800 mb-1">
                {stat.value}
              </Text>
              <Text className="text-sm font-semibold text-green-500">
                {stat.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View className="bg-white p-6 rounded-xl mb-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-5">
          Recent Activity
        </Text>
        <View className="gap-4">
          {recentActivity.map((activity, index) => (
            <View key={index} className="p-3 rounded-lg bg-gray-50 gap-1">
              <Text className="text-base font-semibold text-indigo-500">
                {activity.user}
              </Text>
              <Text className="text-sm text-gray-600">{activity.action}</Text>
              <Text className="text-xs text-gray-400">{activity.time}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-white p-6 rounded-xl mb-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-5">
          Quick Actions
        </Text>
        <View className="gap-3">
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              className="p-4 rounded-lg bg-gray-50 flex-row items-center gap-3 active:bg-indigo-50"
            >
              <Icon name={action.icon} size={20} color="#666" />
              <Text className="text-base font-medium text-gray-600">
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        className="bg-red-500 p-4 rounded-xl flex-row items-center justify-center gap-3 mb-5 shadow-sm active:bg-red-600"
      >
        <Icon name="logout" size={20} color="#fff" />
        <Text className="text-base font-semibold text-white">Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default Dashboard
