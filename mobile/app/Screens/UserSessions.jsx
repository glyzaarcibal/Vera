import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import axiosInstance from '../utils/axios.instance'
import RiskBadge from '../components/RiskBadge'
import SessionCard from '../components/SessionCard'

const UserSessions = ({ navigation }) => {
  const route = useRoute()
  //   const navigation = useNavigation()
  const { userId } = route.params

  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sortOrder, setSortOrder] = useState('desc')

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 9,
    hasNext: false,
    hasPrev: false,
  })

  // Filter state
  const [typeFilter, setTypeFilter] = useState(['voice', 'text'])
  const [riskFilters, setRiskFilters] = useState([])

  // Resource assignment state
  const [availableResources, setAvailableResources] = useState([])
  const [assignedResources, setAssignedResources] = useState([])
  const [selectedResourceIds, setSelectedResourceIds] = useState([])
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchSessions()
    }
  }, [pagination.currentPage, typeFilter, riskFilters])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([
      fetchSessions(),
      fetchUserInfo(),
      fetchAvailableResources(),
      fetchAssignedResources(),
    ])
    setLoading(false)
  }

  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get(
        `/admin/users/get-user-info/${userId}`,
      )
      const { profile } = res.data
      setUserInfo(profile)
    } catch (e) {
      console.error('Error fetching user info:', e)
    }
  }

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.currentPage)
      params.append('limit', pagination.limit)

      if (typeFilter.length === 1) {
        params.append('type', typeFilter[0])
      } else {
        params.append('type', 'all')
      }

      if (riskFilters.length > 0) {
        params.append('riskLevels', riskFilters.join(','))
      }

      const res = await axiosInstance.get(
        `/admin/users/get-sessions-by-user/${userId}?${params.toString()}`,
      )
      const { sessions: fetchedSessions, pagination: paginationData } = res.data
      setSessions(sortSessionsByRisk(fetchedSessions, sortOrder))
      setPagination(paginationData)
    } catch (e) {
      console.error('Error fetching sessions:', e)
    }
  }

  const sortSessionsByRisk = (sessionList, order) => {
    return [...sessionList].sort((a, b) => {
      const scoreA = a.risk_score ?? -1
      const scoreB = b.risk_score ?? -1
      return order === 'desc' ? scoreB - scoreA : scoreA - scoreB
    })
  }

  const handleSortToggle = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc'
    setSortOrder(newOrder)
    setSessions(sortSessionsByRisk(sessions, newOrder))
  }

  const handleTypeFilterToggle = value => {
    setTypeFilter(prev => {
      if (prev.includes(value)) {
        const newFilters = prev.filter(f => f !== value)
        return newFilters.length === 0 ? ['voice', 'text'] : newFilters
      } else {
        return [...prev, value]
      }
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleRiskFilterToggle = value => {
    setRiskFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(f => f !== value)
      } else {
        return [...prev, value]
      }
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = newPage => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  const fetchAvailableResources = async () => {
    try {
      const res = await axiosInstance.get('/resources')
      setAvailableResources(res.data.resources || [])
    } catch (e) {
      console.error('Error fetching available resources:', e)
    }
  }

  const fetchAssignedResources = async () => {
    try {
      const res = await axiosInstance.get(
        `/resources/get-assignments/${userId}`,
      )
      setAssignedResources(res.data.assignments || [])
    } catch (e) {
      console.error('Error fetching assigned resources:', e)
    }
  }

  const handleResourceSelect = resourceId => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId],
    )
  }

  const handleAssignResources = async () => {
    if (selectedResourceIds.length === 0) return

    setAssigning(true)
    try {
      for (const resourceId of selectedResourceIds) {
        await axiosInstance.post('/resources/assign-resource', {
          user_id: userId,
          resource_id: resourceId,
        })
      }
      alert(`Successfully assigned ${selectedResourceIds.length} resource(s)`)
      setSelectedResourceIds([])
      await fetchAssignedResources()
    } catch (e) {
      console.error('Error assigning resources:', e)
      alert(e.response?.data?.message || 'Failed to assign resources')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveAssignment = async assignmentId => {
    try {
      await axiosInstance.delete(`/resources/delete-assignment/${assignmentId}`)
      alert('Resource assignment removed successfully')
      await fetchAssignedResources()
    } catch (e) {
      console.error('Error removing assignment:', e)
      alert(e.response?.data?.message || 'Failed to remove assignment')
    }
  }

  const getRiskStats = () => {
    const stats = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      notAssessed: 0,
    }

    sessions.forEach(session => {
      if (!session.risk_level) {
        stats.notAssessed++
      } else {
        stats[session.risk_level.toLowerCase()]++
      }
    })

    return stats
  }

  const getOverallRisk = () => {
    if (sessions.length === 0) return { level: null, score: 0 }

    const assessedSessions = sessions.filter(s => s.risk_score != null)
    if (assessedSessions.length === 0) return { level: null, score: 0 }

    const avgScore =
      assessedSessions.reduce((sum, s) => sum + s.risk_score, 0) /
      assessedSessions.length

    let level = 'low'
    if (avgScore >= 70) level = 'critical'
    else if (avgScore >= 50) level = 'high'
    else if (avgScore >= 30) level = 'moderate'

    return { level, score: avgScore }
  }

  const riskStats = getRiskStats()
  const overallRisk = getOverallRisk()

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-5 py-6">
        {/* Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-2 bg-white rounded-lg px-4 py-3 mb-5 shadow-sm active:opacity-70"
        >
          <Ionicons name="arrow-back" size={20} color="#6366f1" />
          <Text className="text-indigo-500 text-base font-semibold">Back</Text>
        </Pressable>

        {/* User Profile Header */}
        {userInfo && (
          <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
            <View className="flex-row items-center gap-4 mb-4">
              <Image
                source={{
                  uri: userInfo.avatar_url || 'https://via.placeholder.com/80',
                }}
                className="w-20 h-20 rounded-full border-4 border-indigo-50"
              />
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800 mb-1">
                  {userInfo.username || userInfo.email}
                </Text>
                <Text className="text-sm text-gray-600 mb-2">
                  {userInfo.email}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-gray-400">
                    ID: {userInfo.id}
                  </Text>
                  <Text className="text-xs text-gray-400">•</Text>
                  <Text className="text-xs text-gray-400 capitalize">
                    {userInfo.role}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View
                className={`flex-1 rounded-lg px-3 py-2 ${
                  userInfo.permit_store ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <Text className="text-xs text-gray-600 mb-1">
                  Store Conversations
                </Text>
                <Text
                  className={`text-sm font-semibold ${
                    userInfo.permit_store ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {userInfo.permit_store ? 'Allowed' : 'Denied'}
                </Text>
              </View>
              <View
                className={`flex-1 rounded-lg px-3 py-2 ${
                  userInfo.permit_analyze ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <Text className="text-xs text-gray-600 mb-1">AI Analysis</Text>
                <Text
                  className={`text-sm font-semibold ${
                    userInfo.permit_analyze ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {userInfo.permit_analyze ? 'Allowed' : 'Denied'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Overall Risk Assessment */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-800 mb-1">
              Overall Risk Assessment
            </Text>
            <Text className="text-sm text-gray-500">
              Based on {sessions.filter(s => s.risk_score != null).length}{' '}
              assessed sessions
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-sm text-gray-500 mb-2">Risk Score</Text>
              <Text className="text-3xl font-bold text-gray-800">
                {overallRisk.score.toFixed(0)}
                <Text className="text-lg text-gray-400">/100</Text>
              </Text>
            </View>
            <View className="w-px h-16 bg-gray-200" />
            <View>
              <Text className="text-sm text-gray-500 mb-2">Risk Level</Text>
              <RiskBadge level={overallRisk.level} size="lg" />
            </View>
          </View>

          <View className="border-t border-gray-100 pt-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Risk Distribution
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-row items-center gap-2">
                <RiskBadge level="low" size="sm" />
                <Text className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {riskStats.low}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <RiskBadge level="moderate" size="sm" />
                <Text className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {riskStats.moderate}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <RiskBadge level="high" size="sm" />
                <Text className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {riskStats.high}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <RiskBadge level="critical" size="sm" />
                <Text className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {riskStats.critical}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <RiskBadge level={null} size="sm" />
                <Text className="text-sm font-semibold text-gray-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {riskStats.notAssessed}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assign Resources */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              Assign Resources
            </Text>
            <Pressable
              onPress={handleAssignResources}
              disabled={selectedResourceIds.length === 0 || assigning}
              className={`px-4 py-2 rounded-lg ${
                selectedResourceIds.length > 0 && !assigning
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedResourceIds.length > 0 && !assigning
                    ? 'text-white'
                    : 'text-gray-400'
                }`}
              >
                {assigning
                  ? 'Assigning...'
                  : `Assign (${selectedResourceIds.length})`}
              </Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {availableResources.length === 0 ? (
                <Text className="text-sm text-gray-500">
                  No resources available
                </Text>
              ) : (
                availableResources.map(resource => (
                  <Pressable
                    key={resource.id}
                    onPress={() => handleResourceSelect(resource.id)}
                    className={`w-[180px] rounded-xl overflow-hidden border-2 ${
                      selectedResourceIds.includes(resource.id)
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <View className="relative">
                      {resource.image_url ? (
                        <Image
                          source={{ uri: resource.image_url }}
                          className="w-full h-32"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 items-center justify-center">
                          <Ionicons name="image" size={48} color="white" />
                        </View>
                      )}
                      <View className="absolute top-2 left-2">
                        <Ionicons
                          name={
                            selectedResourceIds.includes(resource.id)
                              ? 'checkbox'
                              : 'square-outline'
                          }
                          size={24}
                          color={
                            selectedResourceIds.includes(resource.id)
                              ? '#3b82f6'
                              : '#9ca3af'
                          }
                        />
                      </View>
                    </View>
                    <View className="p-3">
                      {resource.category && (
                        <Text className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-2 self-start">
                          {resource.category}
                        </Text>
                      )}
                      <Text
                        className="text-sm font-bold text-gray-900 mb-1"
                        numberOfLines={2}
                      >
                        {resource.title}
                      </Text>
                      <Text className="text-xs text-gray-600" numberOfLines={2}>
                        {resource.description}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        </View>

        {/* Assigned Resources */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Assigned Resources ({assignedResources.length})
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {assignedResources.length === 0 ? (
                <Text className="text-sm text-gray-500">
                  No resources assigned yet
                </Text>
              ) : (
                assignedResources.map(assignment => {
                  const resource = availableResources.find(
                    r => r.id === assignment.resource_id,
                  )
                  if (!resource) return null

                  return (
                    <View
                      key={assignment.id}
                      className="w-[180px] rounded-xl overflow-hidden border-2 border-gray-200"
                    >
                      <View className="relative">
                        {resource.image_url ? (
                          <Image
                            source={{ uri: resource.image_url }}
                            className="w-full h-32"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 items-center justify-center">
                            <Ionicons name="image" size={48} color="white" />
                          </View>
                        )}
                        <Pressable
                          onPress={() => handleRemoveAssignment(assignment.id)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md"
                        >
                          <Ionicons name="trash" size={20} color="#ef4444" />
                        </Pressable>
                      </View>
                      <View className="p-3">
                        {resource.category && (
                          <Text className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-2 self-start">
                            {resource.category}
                          </Text>
                        )}
                        <Text
                          className="text-sm font-bold text-gray-900 mb-1"
                          numberOfLines={2}
                        >
                          {resource.title}
                        </Text>
                        <Text
                          className="text-xs text-gray-600"
                          numberOfLines={2}
                        >
                          {resource.description}
                        </Text>
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          </ScrollView>
        </View>

        {/* Sessions Section */}
        <View className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">
              Sessions ({pagination.totalSessions})
            </Text>
            <Pressable
              onPress={handleSortToggle}
              className="flex-row items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg active:opacity-70"
            >
              <Ionicons name="swap-vertical" size={16} color="#4b5563" />
              <Text className="text-sm text-gray-600 font-medium">
                {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
              </Text>
            </Pressable>
          </View>

          {/* Type Filters */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Session Type
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleTypeFilterToggle('voice')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter.includes('voice') ? 'bg-indigo-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    typeFilter.includes('voice')
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                >
                  Voice
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleTypeFilterToggle('text')}
                className={`px-4 py-2 rounded-lg ${
                  typeFilter.includes('text') ? 'bg-indigo-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    typeFilter.includes('text') ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Text
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Risk Level Filters */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Risk Level
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {['low', 'moderate', 'high', 'critical'].map(level => (
                <Pressable
                  key={level}
                  onPress={() => handleRiskFilterToggle(level)}
                  className={`px-3 py-2 rounded-lg ${
                    riskFilters.includes(level)
                      ? 'bg-indigo-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      riskFilters.includes(level)
                        ? 'text-white'
                        : 'text-gray-600'
                    }`}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <View className="bg-white rounded-xl p-10 shadow-sm items-center mb-5">
            <Text className="text-base text-gray-400">
              No sessions found for this user.
            </Text>
          </View>
        ) : (
          <>
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() =>
                  navigation.navigate('UserChat', {
                    sessionId: session.id,
                    userId: userId,
                  })
                }
              />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-5">
                <Text className="text-sm text-gray-600 text-center mb-3">
                  Page {pagination.currentPage} of {pagination.totalPages} •
                  Total: {pagination.totalSessions} sessions
                </Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`flex-1 flex-row items-center justify-center gap-1 px-4 py-3 rounded-lg ${
                      pagination.hasPrev ? 'bg-indigo-500' : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={pagination.hasPrev ? '#ffffff' : '#9ca3af'}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        pagination.hasPrev ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      Previous
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`flex-1 flex-row items-center justify-center gap-1 px-4 py-3 rounded-lg ${
                      pagination.hasNext ? 'bg-indigo-500' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        pagination.hasNext ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      Next
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={pagination.hasNext ? '#ffffff' : '#9ca3af'}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

export default UserSessions
