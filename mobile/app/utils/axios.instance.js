import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { store } from '../store/store'
import { clearUser } from '../store/slices/authSlice'

const axiosInstance = axios.create({
  // baseURL: "https://api.verrai.camp/api",
  baseURL: 'https://backend-pi-blue-64.vercel.app/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  async config => {
    const accessToken = await AsyncStorage.getItem('access_token')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle token expiration and refresh
axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    // Check if the error response contains "Invalid or expired token"
    if (
      error.response &&
      error.response.data &&
      error.response.data.message &&
      (error.response.data.message.includes('Invalid or expired token') ||
        error.response.data.message.includes('Missing access or refresh token'))
    ) {
      // Clear tokens from AsyncStorage
      await AsyncStorage.removeItem('access_token')
      await AsyncStorage.removeItem('refresh_token')

      // Clear Redux state
      store.dispatch(clearUser())

      // Note: Navigation should be handled in the component level
      // You can check for this error and navigate to login screen
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
