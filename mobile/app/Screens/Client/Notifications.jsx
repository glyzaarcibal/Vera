import { View, Text, ScrollView, Pressable, SafeAreaView } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const Notifications = () => {
    const navigation = useNavigation()

    const notifications = [
        {
            id: 1,
            title: 'New Feature: Emotion Recognition',
            message: 'You can now track your emotions through voice analysis!',
            time: '2 hours ago',
            type: 'update',
            icon: 'sparkles',
        },
        {
            id: 2,
            title: 'Weekly Wellness Tip',
            message: 'Remember to take deep breaths throughout the day to reduce stress.',
            time: '1 day ago',
            type: 'news',
            icon: 'bulb',
        },
        {
            id: 3,
            title: 'System Maintenance',
            message: 'We will be performing scheduled maintenance this Sunday at 2 AM.',
            time: '2 days ago',
            type: 'alert',
            icon: 'settings',
        },
    ]

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

            <ScrollView className="flex-1 p-5">
                {notifications.length === 0 ? (
                    <View className="py-20 items-center justify-center">
                        <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                        <Text className="mt-4 text-gray-400 text-lg">No new notifications</Text>
                    </View>
                ) : (
                    <View className="gap-4">
                        {notifications.map((notification) => (
                            <View
                                key={notification.id}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 flex-row gap-4"
                            >
                                <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center">
                                    <Ionicons name={notification.icon} size={24} color="#6366f1" />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="text-base font-bold text-gray-800 flex-1">
                                            {notification.title}
                                        </Text>
                                        <Text className="text-xs text-gray-400">{notification.time}</Text>
                                    </View>
                                    <Text className="text-sm text-gray-600 leading-5">
                                        {notification.message}
                                    </Text>
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
