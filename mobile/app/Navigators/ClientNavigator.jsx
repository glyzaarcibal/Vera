import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import LayoutScreen from '../Screens/Client/_layout'
import NotificationsScreen from '../Screens/Client/Notifications'

const Stack = createStackNavigator()

export default function ClientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Layout"
    >
      <Stack.Screen name="Layout" component={LayoutScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  )
}
