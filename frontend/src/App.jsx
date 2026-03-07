import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "./store/slices/authSelectors";
import { setUser, clearUser } from "./store/slices/authSlice";
import axiosInstance from "./utils/axios.instance";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import Welcome from "./pages/Welcome";
import About from "./pages/About";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import ChatAI from "./pages/ChatAI";
import VoiceAI from "./pages/VoiceAI";
import Dashboard from "./pages/Admin/Dashboard";
import Reports from "./pages/Admin/Reports";
// ...existing code...
import UserManagement from "./pages/Admin/UserManagement";
import UserSessions from "./pages/Admin/UserSessions";
import UserChat from "./pages/Admin/UserChat";
import Resources from "./pages/Admin/Resources";
import AvatarAI from "./pages/Avatar";
import CheckEmail from "./pages/CheckEmail";
import EmailVerified from "./pages/EmailVerified";
import Activities from "./pages/Activities";
import ClipcardGame from "./pages/Activities/ClipcardGame.jsx";
import Diary from "./pages/Activities/Diary";
import MoodTrackerScreen from "./pages/Activities/MoodTrackerScreen";
import SleepTracker from "./pages/Activities/SleepTracker";
import WeeklyWellnessReport from "./pages/Activities/WeeklyWellnessReport";
import TakeABreath from "./pages/Activities/TakeABreath";
import MedicationTracker from "./pages/Activities/MedicationTracker";

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    console.log("App mounted, user:", user);
  }, [user]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/about" element={<About />} />
        <Route path="/notifications" element={<Notifications />} />
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
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/sessions/:userId" element={<UserSessions />} />
        <Route path="/admin/chat/:sessionId" element={<UserChat />} />
        <Route path="/admin/resources" element={<Resources />} />
        {/* <Route path="/admin/activity-graph/:userId" element={<UserActivityGraph />} /> */}
      </Route>
      <Route path="/login" element={<Login />} />
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
