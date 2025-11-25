import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
const Tabs = createBottomTabNavigator()
import HomeScreen from './Home'
import ChatAIScreen from './ChatAI'
import VoiceAIScreen from './VoiceAI'
import ProfileScreen from './Profile'
import { Ionicons } from '@expo/vector-icons'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import Feather from '@expo/vector-icons/Feather'

export default function Layout() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Chat"
        component={ChatAIScreen}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Voice"
        component={VoiceAIScreen}
        options={{
          title: 'Voice',
          tabBarIcon: ({ color, size }) => (
            <SimpleLineIcons name="microphone" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <SimpleLineIcons name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  )
}
