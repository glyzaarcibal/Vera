import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import { FaUserCircle } from "react-icons/fa";
import Switch from "../components/Switch";
import TabGroup from "../components/TabGroup";

const Profile = () => {
  // Custom scrollbar styles
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: linear-gradient(to bottom, #f5f5f5, #e8e8e8);
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
      box-shadow: 0 0 6px rgba(102, 126, 234, 0.5);
    }

    /* Firefox scrollbar */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #667eea #f5f5f5;
    }
  `;

  const user = useSelector(selectUser);
  console.log(user);
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    birthday: "",
    gender: "",
    avatar_url: "",
    permit_store: false,
    permit_analyze: false,
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const fileInputRef = useRef(null);

  const getProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/auth/fetch-profile");
      const { profile: fetchedProfile } = res.data;
      const formattedProfile = {
        email: fetchedProfile.email || "",
        username: fetchedProfile.username || "",
        first_name: fetchedProfile.first_name || "",
        last_name: fetchedProfile.last_name || "",
        birthday: fetchedProfile.birthday || "",
        gender: fetchedProfile.gender || "",
        avatar_url: fetchedProfile.avatar_url || "",
        permit_store: fetchedProfile.permit_store || false,
        permit_analyze: fetchedProfile.permit_analyze || false,
      };
      setProfile(formattedProfile);
      setOriginalProfile(formattedProfile);
    } catch (e) {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const getChatSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await axiosInstance.get("/profile/fetch-sessions");
      const { chat_sessions } = res.data;
      setChatSessions(chat_sessions);
      if (chat_sessions.length > 0) {
        setSelectedSession(chat_sessions[0]);
      }
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setMessage({ type: "", text: "" });
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditMode(false);
    setMessage({ type: "", text: "" });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axiosInstance.put("/auth/update-profile", {
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        birthday: profile.birthday,
        gender: profile.gender,
      });

      setOriginalProfile(profile);
      setIsEditMode(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (e) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    setIsEditingAvatar(true);
    setMessage({ type: "", text: "" });
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axiosInstance.put("/auth/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedProfile = {
        ...profile,
        avatar_url: res.data.profile.avatar_url,
      };
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setIsEditingAvatar(false);
      setMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (e) {
      setMessage({ type: "error", text: "Failed to upload profile picture" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelAvatar = () => {
    setIsEditingAvatar(false);
    setMessage({ type: "", text: "" });
  };

  const handlePermissionChange = async (permissionType) => {
    try {
      const updatedValue = !profile[permissionType];

      const res = await axiosInstance.post("/auth/update-permissions", {
        permit_store:
          permissionType === "permit_store"
            ? updatedValue
            : profile.permit_store,
        permit_analyze:
          permissionType === "permit_analyze"
            ? updatedValue
            : profile.permit_analyze,
      });
      const updatedProfile = {
        ...profile,
        [permissionType]: updatedValue,
      };
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);

      setMessage({
        type: "success",
        text: "Privacy preferences updated successfully!",
      });

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (e) {
      setMessage({
        type: "error",
        text: "Failed to update privacy preferences",
      });
    }
  };

  useEffect(() => {
    getProfile();
    getChatSessions();
  }, []);

  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
      <div className="space-y-5">
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
        <div className="h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "#16a34a";
      case "moderate":
        return "#f59e0b";
      case "high":
        return "#dc2626";
      default:
        return "#9ca3af";
    }
  };

  const renderProfileTab = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Personal Information
        </h1>
        {!isEditMode && (
          <button
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        )}
      </div>

      {message.text && (
        <div
          className={`px-5 py-4 rounded-xl mb-6 flex items-center gap-3 animate-[slideDown_0.3s_ease-in] ${
            message.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 border border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col items-center py-10 mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl">
        <div className="relative mb-5">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile Avatar"
              className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-xl shadow-indigo-500/20 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300"
            />
          ) : (
            <FaUserCircle className="w-36 h-36 text-gray-300 hover:text-indigo-500 hover:scale-105 transition-all duration-300" />
          )}
        </div>

        {!isEditingAvatar ? (
          <button
            className="px-7 py-3 rounded-xl border-2 border-indigo-500 bg-white text-indigo-500 font-semibold hover:bg-indigo-500 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 mt-3"
            onClick={handleAvatarClick}
          >
            Update Profile Picture
          </button>
        ) : (
          <div className="flex gap-3 mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              onClick={handleFileSelect}
              disabled={uploadingAvatar}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploadingAvatar ? "Uploading..." : "Choose File"}
            </button>
            <button
              onClick={handleCancelAvatar}
              disabled={uploadingAvatar}
              className="px-7 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleInputChange}
            disabled={true}
            className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Username
          </label>
          {isEditMode ? (
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          ) : (
            <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 text-base">
              {profile.username || "Not set"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            First Name
          </label>
          {isEditMode ? (
            <input
              type="text"
              name="first_name"
              value={profile.first_name}
              onChange={handleInputChange}
              placeholder="First Name"
              className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          ) : (
            <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 text-base">
              {profile.first_name || "Not set"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Last Name
          </label>
          {isEditMode ? (
            <input
              type="text"
              name="last_name"
              value={profile.last_name}
              onChange={handleInputChange}
              placeholder="Last Name"
              className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          ) : (
            <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 text-base">
              {profile.last_name || "Not set"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Birthday
          </label>
          {isEditMode ? (
            <input
              type="date"
              name="birthday"
              value={profile.birthday}
              onChange={handleInputChange}
              className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          ) : (
            <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 text-base">
              {profile.birthday || "Not set"}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            Gender
          </label>
          {isEditMode ? (
            <select
              name="gender"
              value={profile.gender}
              onChange={handleInputChange}
              className="px-4 py-3.5 rounded-xl border-2 border-gray-200 text-base transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          ) : (
            <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-900 text-base">
              {profile.gender || "Not set"}
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="col-span-full flex gap-3 pt-2">
            <button
              className="flex-1 px-7 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="flex-1 px-7 py-4 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-300"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderPrivacyTab = () => (
    <>
      {message.text && (
        <div
          className={`px-5 py-4 rounded-xl mb-6 flex items-center gap-3 animate-[slideDown_0.3s_ease-in] ${
            message.type === "success"
              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 border border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Privacy & Consent
        </h2>

        <div className="flex justify-between items-start gap-6 p-7 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/15">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2.5">
              Store Conversations
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Allow V.E.R.A. to store your conversations with the AI
              (chat/voice). This data will only be accessible to our staff and
              licensed doctors to help them better understand your situation and
              provide more personalized support and care.
            </p>
          </div>
          <Switch
            id="permit_store"
            checked={profile.permit_store}
            onChange={() => handlePermissionChange("permit_store")}
          />
        </div>

        <div className="flex justify-between items-start gap-6 p-7 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/15">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2.5">
              AI Analysis of Conversations
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Consent to V.E.R.A. using AI to analyze your conversations for
              patterns in emotional state, mental well-being, and potential risk
              indicators. This analysis helps provide early detection of
              emotional distress, generate personalized recommendations, and
              improve the quality of support you receive through predictive
              analytics and mood tracking.
            </p>
          </div>
          <Switch
            id="permit_analyze"
            checked={profile.permit_analyze}
            onChange={() => handlePermissionChange("permit_analyze")}
          />
        </div>
      </div>
    </>
  );

  const renderSessionsTab = () => (
    <div className="space-y-6">
      {loadingSessions ? (
        <div className="text-center py-16 px-10 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          Loading sessions...
        </div>
      ) : chatSessions.length === 0 ? (
        <div className="text-center py-16 px-10 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          No chat sessions found
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-7 min-h-[500px]">
          {/* Sidebar */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4.5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedSession?.id === session.id
                    ? "border-indigo-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg shadow-indigo-500/20 translate-x-1"
                    : "border-gray-200 bg-white hover:border-indigo-500 hover:bg-purple-50 hover:translate-x-1"
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex gap-2 mb-2.5 flex-wrap">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      session.type === "text"
                        ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                        : "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800"
                    }`}
                  >
                    {session.type}
                  </span>
                  {session.risk_level && (
                    <span
                      className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold capitalize tracking-wider text-white shadow-md"
                      style={{
                        backgroundColor: getRiskColor(session.risk_level),
                      }}
                    >
                      {session.risk_level}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 font-medium mb-2.5">
                  {formatDate(session.created_at)}
                </div>
                {session.summary && (
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {session.summary.substring(0, 60)}
                    {session.summary.length > 60 ? "..." : ""}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main Panel */}
          <div className="flex flex-col gap-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {selectedSession ? (
              <>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-7">
                  <div className="flex justify-between items-center mb-5 pb-5 border-b-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                      Session Details
                    </h3>
                    <div className="flex gap-2">
                      <span
                        className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          selectedSession.type === "text"
                            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800"
                            : "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800"
                        }`}
                      >
                        {selectedSession.type}
                      </span>
                      {selectedSession.risk_level && (
                        <span
                          className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold capitalize tracking-wider text-white shadow-md"
                          style={{
                            backgroundColor: getRiskColor(
                              selectedSession.risk_level
                            ),
                          }}
                        >
                          {selectedSession.risk_level}
                          {selectedSession.risk_score
                            ? ` (${selectedSession.risk_score})`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <strong className="text-gray-900 font-bold">Date:</strong>{" "}
                      {formatDate(selectedSession.created_at)}
                    </div>
                    {selectedSession.summary && (
                      <div className="text-sm text-gray-700 leading-relaxed">
                        <strong className="text-gray-900 font-bold">
                          Summary:
                        </strong>{" "}
                        {selectedSession.summary}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-2xl p-7">
                  <h4 className="text-lg font-bold text-gray-900 mb-5">
                    Conversation
                  </h4>
                  {selectedSession.chat_messages.length === 0 ? (
                    <div className="text-center py-16 px-10 text-gray-500 italic bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                      No messages in this session
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {selectedSession.chat_messages.map((message) => (
                        <div
                          key={message.id}
                          className={`px-5 py-4.5 rounded-2xl max-w-[80%] animate-[messageSlide_0.3s_ease-out] ${
                            message.sent_by === "user"
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white self-end ml-auto shadow-lg shadow-indigo-500/30"
                              : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border-2 border-gray-200 self-start"
                          }`}
                        >
                          <div
                            className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                              message.sent_by === "user"
                                ? "text-white/90"
                                : "text-indigo-500"
                            }`}
                          >
                            {message.sent_by === "user" ? "You" : "Sentinel"}
                          </div>
                          <div className="text-sm leading-relaxed mb-2">
                            {message.content || "(No content)"}
                          </div>
                          <div className="text-xs opacity-70 text-right font-medium">
                            {formatDate(message.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-10 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
                Select a session to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="max-w-[1400px] mx-auto px-5 py-10">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-900/10 animate-[fadeIn_0.6s_ease-in]">
          {/* Tabs Navigation */}
          <TabGroup
            tabs={[
              { label: "Profile", value: "profile" },
              { label: "Privacy", value: "privacy" },
              { label: "Sessions", value: "sessions" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          <div className="p-10 animate-[slideIn_0.4s_ease-out]">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "privacy" && renderPrivacyTab()}
            {activeTab === "sessions" && renderSessionsTab()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
