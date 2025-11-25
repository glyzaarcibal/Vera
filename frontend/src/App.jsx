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
import Profile from "./pages/Profile";
import ChatAI from "./pages/ChatAI";
import VoiceAI from "./pages/VoiceAI";
import Dashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import UserSessions from "./pages/Admin/UserSessions";
import UserChat from "./pages/Admin/UserChat";
import Resources from "./pages/Admin/Resources";

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
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<ChatAI />} />
        <Route path="/voice" element={<VoiceAI />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/sessions/:userId" element={<UserSessions />} />
        <Route path="/admin/chat/:sessionId" element={<UserChat />} />
        <Route path="/admin/resources" element={<Resources />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
    </Routes>
  );
};

export default App;
