import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import { FaUserCircle } from "react-icons/fa";
import Switch from "../components/Switch";
import TabGroup from "../components/TabGroup";
import "./Profile.css";

const Profile = () => {
  const user = useSelector(selectUser);
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
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const fileInputRef = useRef(null);

  /* ── Data Fetching ── */
  const getProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/auth/fetch-profile");
      const { profile: p } = res.data;
      const formatted = {
        email: p.email || "",
        username: p.username || "",
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        birthday: p.birthday || "",
        gender: p.gender || "",
        avatar_url: p.avatar_url || "",
        permit_store: p.permit_store || false,
        permit_analyze: p.permit_analyze || false,
      };
      setProfile(formatted);
      setOriginalProfile(formatted);
    } catch {
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
      if (chat_sessions.length > 0) setSelectedSession(chat_sessions[0]);
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const getAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const res = await axiosInstance.get("/profile/fetch-appointments");
      setAppointments(res.data.appointments || []);
    } catch (e) {
      console.error("Failed to load appointments:", e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    getProfile();
    getChatSessions();
    getAppointments();
  }, []);

  /* ── Handlers ── */
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
      await axiosInstance.put("/auth/update-profile", {
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
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    setIsEditingAvatar(true);
    setMessage({ type: "", text: "" });
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axiosInstance.put("/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = { ...profile, avatar_url: res.data.profile.avatar_url };
      setProfile(updated);
      setOriginalProfile(updated);
      setIsEditingAvatar(false);
      setMessage({ type: "success", text: "Profile picture updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to upload profile picture" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelAvatar = () => {
    setIsEditingAvatar(false);
    setMessage({ type: "", text: "" });
  };

  const handlePermissionChange = async (permissionType) => {
    try {
      const updatedValue = !profile[permissionType];
      await axiosInstance.post("/auth/update-permissions", {
        permit_store: permissionType === "permit_store" ? updatedValue : profile.permit_store,
        permit_analyze: permissionType === "permit_analyze" ? updatedValue : profile.permit_analyze,
      });
      const updated = { ...profile, [permissionType]: updatedValue };
      setProfile(updated);
      setOriginalProfile(updated);
      setMessage({ type: "success", text: "Privacy preferences updated!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to update privacy preferences" });
    }
  };

  /* ── Helpers ── */
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "low": return "#16a34a";
      case "moderate": return "#f59e0b";
      case "high": return "#dc2626";
      default: return "#9ca3af";
    }
  };

  /* ── Skeleton ── */
  const SkeletonLoader = () => (
    <div className="animate-pulse flex flex-col gap-4 p-10">
      <div className="profile-skeleton-item w-48 h-6" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="profile-skeleton-item" />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="profile-page-card">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  /* ── Toast helper ── */
  const Toast = () =>
    message.text ? (
      <div className={`vera-toast ${message.type}`}>
        <span>{message.type === "success" ? "✓" : "⚠"}</span>
        {message.text}
      </div>
    ) : null;

  /* ────────────────────────────
     PROFILE TAB
  ──────────────────────────── */
  const renderProfileTab = () => (
    <>
      <div className="profile-tab-header">
        <h2 className="section-title">Personal Information</h2>
        {!isEditMode && (
          <button className="vera-btn primary" onClick={handleEdit}>
            Edit Profile
          </button>
        )}
      </div>

      <Toast />

      {/* Avatar */}
      <div className="profile-avatar-section">
        <div style={{ position: "relative", marginBottom: 16 }}>
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile Avatar"
              className="profile-avatar-img"
            />
          ) : (
            <FaUserCircle className="profile-avatar-icon" />
          )}
        </div>

        {!isEditingAvatar ? (
          <button className="vera-btn outline" onClick={handleAvatarClick}>
            Update Profile Picture
          </button>
        ) : (
          <div className="profile-actions-row" style={{ marginTop: 4 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              className="vera-btn primary"
              onClick={handleFileSelect}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? "Uploading…" : "Choose File"}
            </button>
            <button
              className="vera-btn ghost"
              onClick={handleCancelAvatar}
              disabled={uploadingAvatar}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="profile-form-grid">
        {/* Email */}
        <div className="profile-field col-full">
          <label className="profile-label">Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            disabled
            className="vera-input"
          />
        </div>

        {/* Username */}
        <div className="profile-field">
          <label className="profile-label">Username</label>
          {isEditMode ? (
            <input
              type="text"
              name="username"
              value={profile.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="vera-input"
            />
          ) : (
            <div className="vera-value">{profile.username || "Not set"}</div>
          )}
        </div>

        {/* First Name */}
        <div className="profile-field">
          <label className="profile-label">First Name</label>
          {isEditMode ? (
            <input
              type="text"
              name="first_name"
              value={profile.first_name}
              onChange={handleInputChange}
              placeholder="First Name"
              className="vera-input"
            />
          ) : (
            <div className="vera-value">{profile.first_name || "Not set"}</div>
          )}
        </div>

        {/* Last Name */}
        <div className="profile-field">
          <label className="profile-label">Last Name</label>
          {isEditMode ? (
            <input
              type="text"
              name="last_name"
              value={profile.last_name}
              onChange={handleInputChange}
              placeholder="Last Name"
              className="vera-input"
            />
          ) : (
            <div className="vera-value">{profile.last_name || "Not set"}</div>
          )}
        </div>

        {/* Birthday */}
        <div className="profile-field">
          <label className="profile-label">Birthday</label>
          {isEditMode ? (
            <input
              type="date"
              name="birthday"
              value={profile.birthday}
              onChange={handleInputChange}
              className="vera-input"
            />
          ) : (
            <div className="vera-value">{profile.birthday || "Not set"}</div>
          )}
        </div>

        {/* Gender */}
        <div className="profile-field">
          <label className="profile-label">Gender</label>
          {isEditMode ? (
            <select
              name="gender"
              value={profile.gender}
              onChange={handleInputChange}
              className="vera-select"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          ) : (
            <div className="vera-value">{profile.gender || "Not set"}</div>
          )}
        </div>

        {/* Save / Cancel */}
        {isEditMode && (
          <div className="col-full profile-actions-row" style={{ paddingTop: 8 }}>
            <button
              className="vera-btn primary"
              style={{ flex: 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              className="vera-btn ghost"
              style={{ flex: 1 }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );

  /* ────────────────────────────
     PRIVACY TAB
  ──────────────────────────── */
  const renderPrivacyTab = () => (
    <>
      <h2 className="section-title">Privacy &amp; Consent</h2>
      <Toast />

      <div className="flex flex-col gap-4">
        {/* Store Conversations */}
        <div className="privacy-card">
          <div style={{ flex: 1 }}>
            <p className="privacy-card-title">Store Conversations</p>
            <p className="privacy-card-desc">
              Allow V.E.R.A. to store your conversations with the AI (chat/voice).
              This data will only be accessible to our staff and licensed doctors to
              help them better understand your situation and provide more personalised
              support and care.
            </p>
          </div>
          <Switch
            id="permit_store"
            checked={profile.permit_store}
            onChange={() => handlePermissionChange("permit_store")}
          />
        </div>

        {/* AI Analysis */}
        <div className="privacy-card">
          <div style={{ flex: 1 }}>
            <p className="privacy-card-title">AI Analysis of Conversations</p>
            <p className="privacy-card-desc">
              Consent to V.E.R.A. using AI to analyse your conversations for patterns
              in emotional state, mental well-being, and potential risk indicators.
              This analysis helps provide early detection of emotional distress,
              generate personalised recommendations, and improve the quality of
              support you receive.
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

  /* ────────────────────────────
     SESSIONS TAB
  ──────────────────────────── */
  const renderSessionsTab = () => {
    if (loadingSessions) {
      return (
        <div className="vera-empty-state">
          <div className="vera-spinner" />
          <span>Loading sessions…</span>
        </div>
      );
    }

    if (chatSessions.length === 0) {
      return (
        <div className="vera-empty-state">
          <span className="empty-icon">💬</span>
          <span>No chat sessions found</span>
        </div>
      );
    }

    return (
      <div className="sessions-layout">
        {/* Sidebar */}
        <div className="sessions-sidebar">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${selectedSession?.id === session.id ? "active" : ""}`}
              onClick={() => setSelectedSession(session)}
            >
              <div className="session-badges">
                <span className={`badge ${session.type === "text" ? "text-type" : "voice-type"}`}>
                  {session.type}
                </span>
                {session.risk_level && (
                  <span
                    className="badge risk"
                    style={{ backgroundColor: getRiskColor(session.risk_level) }}
                  >
                    {session.risk_level}
                  </span>
                )}
              </div>
              <div className="session-item-date">{formatDate(session.created_at)}</div>
              {session.summary && (
                <div className="session-item-summary">
                  {session.summary.substring(0, 65)}
                  {session.summary.length > 65 ? "…" : ""}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="sessions-main">
          {selectedSession ? (
            <>
              {/* Detail card */}
              <div className="session-detail-card">
                <div className="session-detail-header">
                  <h3>Session Details</h3>
                  <div className="session-badges">
                    <span className={`badge ${selectedSession.type === "text" ? "text-type" : "voice-type"}`}>
                      {selectedSession.type}
                    </span>
                    {selectedSession.risk_level && (
                      <span
                        className="badge risk"
                        style={{ backgroundColor: getRiskColor(selectedSession.risk_level) }}
                      >
                        {selectedSession.risk_level}
                        {selectedSession.risk_score ? ` (${selectedSession.risk_score})` : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Appointment banner */}
                {selectedSession?.doctor_notes?.find((n) => n.next_appointment) && (
                  <div className="appt-banner">
                    <div className="appt-banner-icon">
                      <svg className="w-5 h-5" style={{ color: "#7c3aed" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="appt-banner-label">Next Appointment</p>
                      <p className="appt-banner-date">
                        {formatDate(selectedSession.doctor_notes.find((n) => n.next_appointment).next_appointment)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <p className="session-meta-row">
                    <strong>Date:</strong> {formatDate(selectedSession.created_at)}
                  </p>
                  {selectedSession.summary && (
                    <p className="session-meta-row">
                      <strong>Summary:</strong> {selectedSession.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Conversation */}
              <div className="conversation-card">
                <h4>Conversation</h4>
                {selectedSession.chat_messages.length === 0 ? (
                  <div className="vera-empty-state" style={{ padding: "40px 24px" }}>
                    <span className="empty-icon">🗒️</span>
                    <span>No messages in this session</span>
                  </div>
                ) : (
                  <div className="messages-list">
                    {selectedSession.chat_messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`message-bubble ${msg.sent_by === "user" ? "user" : "bot"}`}
                      >
                        <div className="msg-sender">
                          {msg.sent_by === "user" ? "You" : "V.E.R.A."}
                        </div>
                        <div className="msg-content">{msg.content || "(No content)"}</div>
                        <div className="msg-time">{formatDate(msg.created_at)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="vera-empty-state">
              <span className="empty-icon">👈</span>
              <span>Select a session to view details</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ────────────────────────────
     APPOINTMENTS TAB
  ──────────────────────────── */
  const renderAppointmentsTab = () => {
    if (loadingAppointments) {
      return (
        <div className="vera-empty-state">
          <div className="vera-spinner" />
          <span>Loading appointments…</span>
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="vera-empty-state">
          <span className="empty-icon">📅</span>
          <span>No appointments found</span>
        </div>
      );
    }

    return (
      <>
        <h2 className="section-title">My Appointments</h2>
        <div className="appointments-grid">
          {appointments.map((appt) => (
            <div key={appt.id} className="appointment-card">
              <div className="appointment-card-header">
                <div className="appointment-icon-wrap">
                  <svg className="w-5 h-5" style={{ color: "#7c3aed" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="appointment-sublabel">
                    Session #{(typeof appt.chat_sessions?.id === "string"
                      ? appt.chat_sessions.id.substring(0, 8)
                      : typeof appt.session_id === "string"
                        ? appt.session_id.substring(0, 8)
                        : "N/A")}…
                  </p>
                  <p className="appointment-subtitle">
                    {appt.chat_sessions?.type || "Unknown"} Session
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="appt-field-label">Appointment Date &amp; Time</p>
                  <p className="appt-field-value">{formatDate(appt.next_appointment)}</p>
                </div>

                <div>
                  <p className="appt-field-label">Doctor</p>
                  <p className="appt-field-doctor">
                    Dr. {appt.profiles?.first_name || ""} {appt.profiles?.last_name || "Unknown"}
                  </p>
                </div>

                {appt.clinical_observations && (
                  <div className="appt-observations">
                    <p className="appt-field-label" style={{ marginBottom: 6 }}>
                      Clinical Observations
                    </p>
                    <p>{appt.clinical_observations}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  /* ── Render ── */
  return (
    <div className="profile-page-container">
      {/* Header */}
      <div className="profile-page-header">
        <div className="eyebrow">👤 Account</div>
        <h1 className="profile-page-title">
          Profile <span className="profile-page-title-accent">&amp; Settings</span>
        </h1>
        <p className="profile-page-subtitle">
          Manage your account details, privacy preferences, sessions, and appointments
        </p>
      </div>

      {/* Card */}
      <div className="profile-page-card">
        <TabGroup
          tabs={[
            { label: "Profile", value: "profile" },
            { label: "Privacy", value: "privacy" },
            { label: "Sessions", value: "sessions" },
            { label: "Appointments", value: "appointments" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="profile-page-content">
          {activeTab === "profile"      && renderProfileTab()}
          {activeTab === "privacy"      && renderPrivacyTab()}
          {activeTab === "sessions"     && renderSessionsTab()}
          {activeTab === "appointments" && renderAppointmentsTab()}
        </div>
      </div>
    </div>
  );
};

export default Profile;