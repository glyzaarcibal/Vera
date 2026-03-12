import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons'
import axiosInstance from '../../utils/axios.instance'

const Dashboard = ({ navigation }) => {
  const name = useSelector(state => state.name.value)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    avatarSessions: 0,
    averageRiskScore: null,
    apiHealthy: false,
  })
  const [recentActivity, setRecentActivity] = useState([])

  const formatRelativeTime = timestamp => {
    if (!timestamp) return 'Unknown time'

    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now - then

    if (Number.isNaN(then.getTime()) || diffMs < 0) {
      return 'Just now'
    }

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diffMs < minute) return 'Just now'
    if (diffMs < hour) {
      const mins = Math.floor(diffMs / minute)
      return `${mins} minute${mins > 1 ? 's' : ''} ago`
    }
    if (diffMs < day) {
      const hours = Math.floor(diffMs / hour)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }

    const days = Math.floor(diffMs / day)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const [totalUsersRes, activeUsersRes, riskStatsRes, usersListRes] =
        await Promise.all([
          axiosInstance.get('/admin/users/get-all-users?page=1&limit=1'),
          axiosInstance.get(
            '/admin/users/get-all-users?page=1&limit=1&status=active',
          ),
          axiosInstance.get('/admin/users/avatar-risk-stats'),
          axiosInstance.get('/admin/users/get-all-users?page=1&limit=5'),
        ])

      const totalUsers = totalUsersRes?.data?.pagination?.totalUsers ?? 0
      const activeUsers = activeUsersRes?.data?.pagination?.totalUsers ?? 0
      const avatarSessions = riskStatsRes?.data?.total ?? 0
      const averageRiskScore = riskStatsRes?.data?.averageScore ?? null
      const users = usersListRes?.data?.users ?? []

      const formattedActivity = users
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(user => ({
          id: user.id,
          user: user.profile?.username || user.email || 'Unknown user',
          action: 'Joined the platform',
          time: formatRelativeTime(user.created_at),
        }))

      setStatsData({
        totalUsers,
        activeUsers,
        avatarSessions,
        averageRiskScore,
        apiHealthy: true,
      })
      setRecentActivity(formattedActivity)
      setErrorMessage('')
    } catch (e) {
      console.error('Error fetching dashboard data:', e)
      setStatsData(prev => ({ ...prev, apiHealthy: false }))
      setErrorMessage(
        e?.response?.data?.message ||
          'Could not load dashboard data. Pull down to retry.',
      )
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchDashboardData()
      setLoading(false)
    }

    load()
  }, [fetchDashboardData])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: statsData.totalUsers.toLocaleString(),
        icon: 'people',
        change: `${statsData.activeUsers.toLocaleString()} active`,
      },
      {
        label: 'Avatar Sessions',
        value: statsData.avatarSessions.toLocaleString(),
        icon: 'check-circle',
        change: 'All-time tracked',
      },
      {
        label: 'Avg Risk Score',
        value:
          statsData.averageRiskScore == null
            ? 'N/A'
            : `${statsData.averageRiskScore}`,
        icon: 'analytics',
        change:
          statsData.averageRiskScore == null
            ? 'No data yet'
            : 'Across assessed sessions',
      },
      {
        label: 'System Status',
        value: statsData.apiHealthy ? 'Healthy' : 'Degraded',
        icon: 'verified',
        change: statsData.apiHealthy ? 'API reachable' : 'Retry needed',
      },
    ],
    [statsData],
  )

  const quickActions = [
    {
      label: 'User Management',
      icon: 'group',
      onPress: () => navigation.navigate('User Management'),
    },
    {
      label: 'Resource Management',
      icon: 'menu-book',
      onPress: () => navigation.navigate('Resource Management'),
    },
    {
      label: 'Refresh Data',
      icon: 'refresh',
      onPress: onRefresh,
    },
  ]

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#667eea" />
        <Text className="text-gray-600 mt-3">Loading dashboard...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 p-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-800 mb-2">Dashboard</Text>
        <Text className="text-base text-gray-600">
          Welcome back, {name}! Here's what's happening today.
        </Text>
      </View>

      {!!errorMessage && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <Text className="text-red-700 text-sm">{errorMessage}</Text>
        </View>
      )}

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-3 mb-8">
        {stats.map((stat, index) => (
          <View
            key={index}
            className="bg-white p-4 rounded-lg flex-1 min-w-[47%] flex-row items-center gap-3 shadow-sm"
          >
            <View className="w-11 h-11 bg-indigo-50 rounded-lg items-center justify-center">
              <Icon name={stat.icon} size={24} color="#667eea" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-400 mb-0.5">{stat.label}</Text>
              <Text className="text-2xl font-bold text-gray-800 mb-0.5">
                {stat.value}
              </Text>
              <Text className="text-xs font-semibold text-green-500">
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
          {recentActivity.length === 0 ? (
            <Text className="text-sm text-gray-500">No recent activity yet.</Text>
          ) : (
            recentActivity.map(activity => (
              <View key={activity.id} className="p-3 rounded-lg bg-gray-50 gap-1">
                <Text className="text-base font-semibold text-indigo-500">
                  {activity.user}
                </Text>
                <Text className="text-sm text-gray-600">{activity.action}</Text>
                <Text className="text-xs text-gray-400">{activity.time}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-white p-6 rounded-xl mb-5 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800 mb-5">
          Quick Actions
        </Text>
        <View className="gap-3">
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              disabled={action.disabled}
              className={`p-4 rounded-lg flex-row items-center gap-3 active:bg-indigo-50 ${
                action.disabled ? 'bg-gray-100' : 'bg-gray-50'
              }`}
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
