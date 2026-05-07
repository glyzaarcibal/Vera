import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "./store/slices/authSelectors.js";
import { setUser, clearUser } from "./store/slices/authSlice.js";
import axiosInstance from "./utils/axios.instance.js";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Welcome from "./pages/Welcome.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import UpdatePassword from "./pages/UpdatePassword.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Profile from "./pages/Profile.jsx";
import ChatAI from "./pages/ChatAI.jsx";
import VoiceAI from "./pages/VoiceAI.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import Reports from "./pages/Admin/Reports.jsx";
// ...existing code...
import UserManagement from "./pages/Admin/UserManagement.jsx";
import UserSessions from "./pages/Admin/UserSessions.jsx";
import UserChat from "./pages/Admin/UserChat.jsx";
import Resources from "./pages/Admin/Resources.jsx";
import FeedbackManagement from "./pages/Admin/FeedbackManagement.jsx";
import AvatarAI from "./pages/Avatar.jsx";
import PsychologyLayout from "./layouts/PsychologyLayout.jsx";
import PsychologyDashboard from "./pages/Psychology/Dashboard.jsx";
import PsychologyUserManagement from "./pages/Psychology/UserManagement.jsx";
import CheckEmail from "./pages/CheckEmail.jsx";
import EmailVerified from "./pages/EmailVerified.jsx";
import Activities from "./pages/Activities.jsx";
import ClipcardGame from "./pages/Activities/ClipcardGame.jsx";
import Diary from "./pages/Activities/Diary.jsx";
import MoodTrackerScreen from "./pages/Activities/MoodTrackerScreen.jsx";
import SleepTracker from "./pages/Activities/SleepTracker.jsx";
import WeeklyWellnessReport from "./pages/Activities/WeeklyWellnessReport.jsx";
import TakeABreath from "./pages/Activities/TakeABreath.jsx";
import MedicationTracker from "./pages/Activities/MedicationTracker.jsx";
import Feedback from "./pages/Feedback.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/auth/fetch-profile");
        if (res.data.profile) {
          dispatch(setUser(res.data.profile));
        }
      } catch (e) {
        console.error("Error refreshing profile:", e);
        // If profile fetch fails (e.g., token expired), interceptor will handle it
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [dispatch]);

  useEffect(() => {
    console.log("App mounted, user:", user);
  }, [user]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Welcome />} />
        <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/" />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<ChatAI />} />
        <Route path="/voice" element={<VoiceAI />} />
        <Route path="/avatar" element={<AvatarAI />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/clipcard" element={<ClipcardGame />} />
        <Route path="/activities/diary" element={<Diary />} />
        <Route path="/activities/mood-tracker" element={<MoodTrackerScreen />} />
        <Route path="/activities/sleep-tracker" element={<SleepTracker />} />
        <Route
          path="/activities/weekly-wellness-report"
          element={<WeeklyWellnessReport />}
        />
        <Route path="/activities/take-a-breath" element={<TakeABreath />} />
        <Route path="/activities/medication-history" element={<MedicationTracker />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/sessions/:userId" element={<UserSessions />} />
        <Route path="/admin/chat/:sessionId" element={<UserChat />} />
        <Route path="/admin/resources" element={<Resources />} />
        <Route path="/admin/feedback" element={<FeedbackManagement />} />
        {/* <Route path="/admin/activity-graph/:userId" element={<UserActivityGraph />} /> */}
      </Route>
      <Route path="/psychology" element={<PsychologyLayout />}>
        <Route index element={<PsychologyDashboard />} />
        <Route path="/psychology/users" element={<PsychologyUserManagement />} />
        <Route path="/psychology/sessions/:userId" element={<UserSessions />} />
        <Route path="/psychology/chat/:sessionId" element={<UserChat />} />
        <Route path="/psychology/resources" element={<Resources />} />
        <Route path="/psychology/reports" element={<Reports />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  );
};

export default App;
