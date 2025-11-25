import axios from "axios";
import { store } from "../store/store";
import { clearUser } from "../store/slices/authSlice";

const axiosInstance = axios.create({
  // baseURL: "https://api.verrai.camp/api",
  baseURL: "http://localhost:5000/api",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error response contains "Invalid or expired token"
    if (
      error.response &&
      error.response.data &&
      error.response.data.message &&
      (error.response.data.message.includes("Invalid or expired token") ||
        error.response.data.message.includes("Missing access or refresh token"))
    ) {
      // Clear Redux state
      store.dispatch(clearUser());

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
