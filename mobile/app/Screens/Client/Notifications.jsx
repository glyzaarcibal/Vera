import {
    View,
    Text,
    ScrollView,
    Pressable,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import axiosInstance from '../../utils/axios.instance'

const Notifications = () => {
    const navigation = useNavigation()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')

    const formatDate = dateString => {
        if (!dateString) return '-'

        const date = new Date(dateString)
        if (Number.isNaN(date.getTime())) return '-'

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const fetchNotifications = useCallback(async () => {
        try {
            setError('')
            const res = await axiosInstance.get('/profile/fetch-sessions')
            const chatSessions = Array.isArray(res.data?.chat_sessions)
                ? res.data.chat_sessions
                : []

            const appointmentNotifications = chatSessions.flatMap(session => {
                const notes = Array.isArray(session?.doctor_notes)
                    ? session.doctor_notes
                    : session?.doctor_notes
                        ? [session.doctor_notes]
                        : []

                return notes
                    .filter(note => note?.next_appointment)
                    .map(note => ({
                        id: `apt-${note.id || `${session.id}-${note.created_at || Date.now()}`}`,
                        title: 'New Appointment Scheduled',
                        message: `Dr. ${note.profiles?.first_name || ''} ${note.profiles?.last_name || 'Unknown'} has scheduled a new appointment for you.`,
                        time: note.created_at
                            ? new Date(note.created_at).toLocaleDateString()
                            : 'Recently',
                        date: note.next_appointment,
                        type: 'appointment',
                        icon: 'calendar-outline',
                    }))
            })

            const staticNotifications = [
                {
                    id: 'static-feature-emotion',
                    title: 'New Feature: Emotion Recognition',
                    message: 'You can now track your emotions through voice analysis!',
                    time: '2 hours ago',
                    type: 'update',
                    icon: 'sparkles-outline',
                },
            ]

            setNotifications([...appointmentNotifications, ...staticNotifications])
        } catch (e) {
            console.error('Failed to fetch notifications:', e)
            setError('Failed to load notifications. Pull down to try again.')
            setNotifications([])
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            await fetchNotifications()
            setLoading(false)
        }

        load()
    }, [fetchNotifications])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await fetchNotifications()
        setRefreshing(false)
    }, [fetchNotifications])

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="px-5 py-4 bg-white border-b border-gray-100 flex-row items-center gap-4">
                <Pressable
                    onPress={() => navigation.goBack()}
                    className="p-2 rounded-full active:bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={24} color="#6366f1" />
                </Pressable>
                <Text className="text-xl font-bold text-gray-800">Notifications</Text>
            </View>

            <ScrollView
                className="flex-1 p-5"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <View className="py-20 items-center justify-center">
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text className="mt-4 text-gray-500 text-base">Loading notifications...</Text>
                    </View>
                ) : error ? (
                    <View className="py-20 items-center justify-center px-3">
                        <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
                        <Text className="mt-3 text-red-500 text-base text-center">{error}</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View className="py-20 items-center justify-center">
                        <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                        <Text className="mt-4 text-gray-400 text-lg">No new notifications</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {notifications.map(notification => (
                            <View
                                key={notification.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex-row gap-4"
                            >
                                <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center">
                                    <Ionicons name={notification.icon} size={22} color="#6366f1" />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1 gap-3">
                                        <Text className="text-base font-bold text-gray-800 flex-1">
                                            {notification.title}
                                        </Text>
                                        <Text className="text-xs text-gray-400">{notification.time}</Text>
                                    </View>

                                    <Text className="text-sm text-gray-600 leading-5">
                                        {notification.message}
                                    </Text>

                                    <View className="mt-3 flex-row items-center justify-between">
                                        <View
                                            className={`${notification.type === 'appointment' ? 'bg-violet-100' : 'bg-blue-100'} px-2.5 py-1 rounded-md`}
                                        >
                                            <Text
                                                className={`${notification.type === 'appointment' ? 'text-violet-700' : 'text-blue-700'} text-[11px] font-bold uppercase`}
                                            >
                                                {notification.type}
                                            </Text>
                                        </View>

                                        <Text className="text-xs text-gray-500">
                                            {notification.type === 'appointment'
                                                ? formatDate(notification.date)
                                                : '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default Notifications
