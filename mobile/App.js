import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import ClientStack from './app/Navigators/ClientNavigator'
import AdminDrawer from './app/Navigators/AdminNavigation'
import Welcome from './app/Screens/Welcome'
import Login from './app/Screens/Login'
import UserChat from './app/Screens/UserChat'
import UserSessions from './app/Screens/UserSessions'
import Register from './app/Screens/Register'

import './app/styles/global.css'
import store from './app/States/store'
import { Provider } from 'react-redux'

const Stack = createStackNavigator()

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
        >
          <Stack.Screen name="UserChat" component={UserChat} />
          <Stack.Screen name="UserSessions" component={UserSessions} />
          <Stack.Screen name="ClientStack" component={ClientStack} />
          <Stack.Screen name="AdminDrawer" component={AdminDrawer} />
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  )
}
