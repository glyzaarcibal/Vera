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
import FeedbackManagement from "./pages/Admin/FeedbackManagement";
import AvatarAI from "./pages/Avatar";
import PsychologyLayout from "./layouts/PsychologyLayout";
import PsychologyDashboard from "./pages/Psychology/Dashboard";
import PsychologyUserManagement from "./pages/Psychology/UserManagement";
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
import Feedback from "./pages/Feedback";
import UserDashboard from "./pages/UserDashboard";
import Loader from "./components/Loader";
import DownloadApk from "./pages/DownloadApk";
import ScrollToTop from "./components/ScrollToTop";

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [appLoading, setAppLoading] = React.useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // Avoid calling fetch-profile if we know there is no active session
      // This prevents the 401/400 error in the console.
      const hasActiveSession = localStorage.getItem("vera_session_active") === "true";
      
      if (!hasActiveSession) {
        setAppLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get("/auth/fetch-profile");
        if (res.data.profile) {
          dispatch(setUser(res.data.profile));
        }
      } catch (e) {
        if (e.response?.status !== 401 && e.response?.status !== 400) {
          console.error("Error refreshing profile:", e);
        }
        dispatch(clearUser());
        localStorage.removeItem("vera_session_active");
      } finally {
        // Add a slight delay for smooth transition
        setTimeout(() => setAppLoading(false), 1500);
      }
    };

    fetchProfile();
  }, [dispatch]);

  if (appLoading) return <Loader text="Synchronizing your sanctuary..." />;

  return (
    <>
      <ScrollToTop />
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
        <Route path="/activities/clipcard" element={user ? <ClipcardGame /> : <Navigate to="/activities" />} />
        <Route path="/activities/diary" element={user ? <Diary /> : <Navigate to="/activities" />} />
        <Route path="/activities/mood-tracker" element={user ? <MoodTrackerScreen /> : <Navigate to="/activities" />} />
        <Route path="/activities/sleep-tracker" element={user ? <SleepTracker /> : <Navigate to="/activities" />} />
        <Route
          path="/activities/weekly-wellness-report"
          element={user ? <WeeklyWellnessReport /> : <Navigate to="/activities" />}
        />
        <Route path="/activities/take-a-breath" element={user ? <TakeABreath /> : <Navigate to="/activities" />} />
        <Route path="/activities/medication-history" element={user ? <MedicationTracker /> : <Navigate to="/activities" />} />
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
      <Route path="/download-apk" element={<DownloadApk />} />
    </Routes>
    </>
  );
};

export default App;
