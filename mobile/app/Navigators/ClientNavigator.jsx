import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import LayoutScreen from '../Screens/Client/_layout'
import ClipCardGameScreen from '../Screens/Client/Activities/ClipCardGame'
import DiaryScreen from '../Screens/Client/Activities/Diary'
import MoodTrackerScreen from '../Screens/Client/Activities/MoodTrackerScreen'
import SleepTrackerScreen from '../Screens/Client/Activities/SleepTracker'
import TakeABreathScreen from '../Screens/Client/Activities/TakeABreath'
import WeeklyWellnessReportScreen from '../Screens/Client/Activities/WeeklyWellnessReport'
import MedicationHistoryScreen from '../Screens/Client/Activities/MedicationHistory'
import NotificationsScreen from '../Screens/Client/Notifications'
import AvatarAI from '../Screens/Client/AvatarAI'
import DIDAgent from '../Screens/Client/DIDAgent'

const Stack = createStackNavigator()

export default function ClientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Layout"
    >
      <Stack.Screen name="Layout" component={LayoutScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AvatarAI" component={AvatarAI} />
        <Stack.Screen name="DIDAgent" component={DIDAgent} />
      <Stack.Screen name="ClipCardGame" component={ClipCardGameScreen} />
      <Stack.Screen name="Diary" component={DiaryScreen} />
      <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} />
      <Stack.Screen name="SleepTracker" component={SleepTrackerScreen} />
      <Stack.Screen name="TakeABreath" component={TakeABreathScreen} />
      <Stack.Screen name="WeeklyWellnessReport" component={WeeklyWellnessReportScreen} />
      <Stack.Screen name="MedicationHistory" component={MedicationHistoryScreen} />
    </Stack.Navigator>
  )
}
