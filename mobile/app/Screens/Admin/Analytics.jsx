import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image, // Add this
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import axiosInstance from '../../utils/axios.instance'

const Analytics = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchAllUsers()
  }, [currentPage, debouncedSearch, roleFilter, statusFilter])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      })

      const res = await axiosInstance.get(
        `/admin/users/get-all-users?${params}`,
      )
      const usersData = res.data.users

      if (!Array.isArray(usersData)) {
        console.error('Users data is not an array:', res.data)
        return
      }

      const formattedUsers = usersData.map(user => ({
        id: user.id,
        username: user.profile?.username || 'Unknown',
        email: user.email,
        role: user.profile?.role || 'user',
        status: user.is_anonymous ? 'Inactive' : 'Active',
        joined: new Date(user.created_at).toISOString().split('T')[0],
        avatar_url: user.profile?.avatar_url || null,
      }))

      setUsers(formattedUsers)
      setPagination(res.data.pagination)
    } catch (e) {
      console.error('Error fetching users:', e)
      alert(e.response?.data?.message || 'Internal Server Error')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeStyles = role => {
    const lowerRole = role.toLowerCase()
    if (lowerRole === 'admin') {
      return 'bg-purple-100 text-purple-800'
    } else if (lowerRole === 'moderator') {
      return 'bg-blue-100 text-blue-800'
    } else {
      return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeStyles = status => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus === 'active') {
      return 'bg-green-100 text-green-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  const renderUserCard = ({ item: user }) => (
    <View className="bg-white rounded-lg mb-4 p-4 mx-4 shadow-sm border border-gray-200">
      {/* User Info Section */}
      <View className="flex-row items-center mb-4">
        {user.avatar_url ? (
          <View className="w-12 h-12 rounded-full overflow-hidden mr-3">
            <Image
              source={{ uri: user.avatar_url }}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </View>
        ) : (
          <View className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <Text className="text-white font-semibold text-lg">
              {user.username[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-base mb-1">
            {user.username}
          </Text>
          <Text className="text-gray-600 text-sm">{user.email}</Text>
        </View>
      </View>

      {/* Badges Section */}
      <View className="flex-row gap-2 mb-4">
        <View
          className={`px-3 py-1 rounded-full ${getRoleBadgeStyles(user.role)}`}
        >
          <Text className="text-xs font-semibold">{user.role}</Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusBadgeStyles(user.status)}`}
        >
          <Text className="text-xs font-semibold">{user.status}</Text>
        </View>
      </View>

      {/* Joined Date */}
      <Text className="text-gray-600 text-sm mb-4">Joined: {user.joined}</Text>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UserSessions', { userId: user.id })
          }
          className="flex-1 bg-green-600 py-3 px-4 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-sm">
            View Sessions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-blue-600 py-3 px-4 rounded-lg">
          <Text className="text-white text-center font-semibold text-sm">
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-red-600 py-3 px-4 rounded-lg">
          <Text className="text-white text-center font-semibold text-sm">
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-6 mb-4 shadow-sm">
          <Text className="text-gray-900 font-bold text-2xl mb-2">
            User Management
          </Text>
          <Text className="text-gray-600 text-sm">
            Manage and monitor all users in the system.
          </Text>
        </View>

        {/* Search Input */}
        <View className="px-4 mb-4">
          <TextInput
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </View>

        {/* Filters */}
        <View className="px-4 mb-4">
          <View className="bg-white border border-gray-300 rounded-lg mb-3 overflow-hidden">
            <Picker
              selectedValue={roleFilter}
              onValueChange={value => {
                setRoleFilter(value)
                setCurrentPage(1)
              }}
              className="h-12"
            >
              <Picker.Item label="All Roles" value="all" />
              <Picker.Item label="Admin" value="admin" />
              <Picker.Item label="Moderator" value="moderator" />
              <Picker.Item label="User" value="user" />
            </Picker>
          </View>

          <View className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <Picker
              selectedValue={statusFilter}
              onValueChange={value => {
                setStatusFilter(value)
                setCurrentPage(1)
              }}
              className="h-12"
            >
              <Picker.Item label="All Status" value="all" />
              <Picker.Item label="Active" value="active" />
              <Picker.Item label="Inactive" value="inactive" />
            </Picker>
          </View>
        </View>

        {/* Add User Button */}
        <View className="px-4 mb-4">
          <TouchableOpacity className="bg-blue-600 py-3 px-4 rounded-lg flex-row items-center justify-center gap-2">
            <Text className="text-white font-semibold text-base">
              + Add User
            </Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        {loading ? (
          <View className="py-8">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserCard}
            keyExtractor={user => user.id.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <View className="py-8 px-4">
                <Text className="text-gray-500 text-center text-base">
                  No users found
                </Text>
              </View>
            }
          />
        )}

        {/* Pagination */}
        <View className="px-4 py-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <TouchableOpacity
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
              className={`bg-white border border-gray-300 rounded-lg py-3 px-6 ${
                !pagination.hasPrev ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-gray-900 font-semibold text-sm">
                ← Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setCurrentPage(prev =>
                  Math.min(pagination.totalPages, prev + 1),
                )
              }
              disabled={!pagination.hasNext}
              className={`bg-white border border-gray-300 rounded-lg py-3 px-6 ${
                !pagination.hasNext ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-gray-900 font-semibold text-sm">
                Next →
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 text-center text-sm">
            Page {pagination.currentPage} of {pagination.totalPages} (
            {pagination.totalUsers} users)
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Analytics
