import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import { 
  FaUserCircle, 
  FaUserShield,
  FaRegCommentDots,
  FaRegClipboard,
  FaEdit
} from "react-icons/fa";
import Switch from "../components/Switch";
import "./Profile.css";

const Profile = () => {
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState("privacy");
  const [profile, setProfile] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    birthday: "",
    gender: "",
    contact_number: "",
    avatar_url: "",
    permit_store: false,
    permit_analyze: false,
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab data states
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  
  // Sessions filters
  const [sessionSortOrder, setSessionSortOrder] = useState("desc");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("all");
  const [sessionRiskFilter, setSessionRiskFilter] = useState("all");

  // Actions states
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
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
        birthday: p.birthday ? p.birthday.split('T')[0] : "",
        gender: p.gender || "",
        contact_number: p.contact_number || "",
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
        contact_number: profile.contact_number,
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
      setMessage({ type: "success", text: "Profile picture updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to upload profile picture" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
  const formatDate = (dateString, useTime = true) => {
    if (!dateString) return "—";
    const options = {
      month: "short",
      day: "2-digit",
      year: "numeric",
    };
    if (useTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getRiskRiskText = (riskLevel, score) => {
    if (!riskLevel) return null;
    let label = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
    if (score) label += `(${score})`;
    return label;
  };

  const Toast = () =>
    message.text ? (
      <div className={`vera-toast ${message.type}`}>
        {message.text}
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="loading-box">Loading...</div>
      </div>
    );
  }

  /* ────────────────────────────
     PRIVACY TAB
  ──────────────────────────── */
  const renderPrivacyTab = () => (
    <div className="tab-content">
      <h2 className="content-title">Privacy &amp; Consent</h2>
      <Toast />

      {/* Store Conversations */}
      <div className="privacy-card-new">
        <div className="privacy-card-header">Store Conversations</div>
        <div className="privacy-card-body">
          <p>
            Allow V.E.R.A. to store your conversations with the AI (chat/voice).
            This data will only be accessible to our staff and licensed doctors to
            help them better understand your situation and provide more personalized
            support and care.
          </p>
          <Switch
            id="permit_store"
            checked={profile.permit_store}
            onChange={() => handlePermissionChange("permit_store")}
          />
        </div>
      </div>

      {/* AI Analysis */}
      <div className="privacy-card-new">
        <div className="privacy-card-header">AI Analysis of Conversations</div>
        <div className="privacy-card-body">
          <p>
            Consent to V.E.R.A. using AI to analyse your conversations for patterns
            in emotional state, mental well-being, and potential risk indicators.
            This analysis helps provide early detection of emotional distress,
            generate personalised recommendations, and improve the quality of
            support you receive.
          </p>
          <Switch
            id="permit_analyze"
            checked={profile.permit_analyze}
            onChange={() => handlePermissionChange("permit_analyze")}
          />
        </div>
      </div>
    </div>
  );

  /* ────────────────────────────
     SESSIONS TAB
  ──────────────────────────── */
  const renderSessionsTab = () => {
    if (loadingSessions) {
      return <div className="loading-box">Loading sessions...</div>;
    }

    let filteredSessions = chatSessions;

    // Filter by Type
    if (sessionTypeFilter !== "all") {
      filteredSessions = filteredSessions.filter(s => s.type?.toLowerCase() === sessionTypeFilter);
    }

    // Filter by Risk
    if (sessionRiskFilter !== "all") {
      filteredSessions = filteredSessions.filter(s => s.risk_level?.toLowerCase() === sessionRiskFilter);
    }

    // Sort by Date
    filteredSessions = [...filteredSessions].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sessionSortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return (
      <div className="tab-content">
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", flexShrink: 0 }}>
          <select 
            value={sessionSortOrder} 
            onChange={(e) => setSessionSortOrder(e.target.value)} 
            className="sidebar-input"
            style={{flex: 1, minWidth: "120px", height: "30px", borderRadius: "8px"}}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          <select 
            value={sessionTypeFilter} 
            onChange={(e) => setSessionTypeFilter(e.target.value)} 
            className="sidebar-input"
            style={{flex: 1, minWidth: "120px", height: "30px", borderRadius: "8px"}}
          >
            <option value="all">All AI Types</option>
            <option value="text">Text</option>
            <option value="voice">Voice</option>
            <option value="avatar">Avatar</option>
          </select>
          <select 
            value={sessionRiskFilter} 
            onChange={(e) => setSessionRiskFilter(e.target.value)} 
            className="sidebar-input"
            style={{flex: 1, minWidth: "120px", height: "30px", borderRadius: "8px"}}
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="sessions-layout-new">
          
          {/* List */}
          <div className="session-list-new">
            {filteredSessions.length === 0 ? (
              <p style={{fontFamily:"'DM Sans', sans-serif", fontSize:"12px"}}>No sessions found.</p>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item-new ${selectedSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="session-badges-new">
                    <span className={`badge-new ${session.type === 'text' ? 'text' : session.type === 'voice' ? 'voice' : 'avatar'}`}>
                      {session.type ? session.type.charAt(0).toUpperCase() + session.type.slice(1) : 'Unknown'}
                    </span>
                    {session.risk_level && (
                      <span className={`badge-new risk-${session.risk_level.toLowerCase()}`}>
                        {getRiskRiskText(session.risk_level, session.risk_score)}
                      </span>
                    )}
                  </div>
                  <div className="session-date-new">
                    Date: {formatDate(session.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details */}
          <div className="session-detail-new">
            <h2 className="content-title" style={{marginBottom: "12px"}}>Session Details</h2>
            {selectedSession ? (
              <>
                <div className="session-detail-header-row">
                  <div className="session-detail-date">
                    Date: {formatDate(selectedSession.created_at)}
                  </div>
                  <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
                    {selectedSession.risk_level && (
                      <span className={`badge-new risk-${selectedSession.risk_level.toLowerCase()}`}>
                        {getRiskRiskText(selectedSession.risk_level, selectedSession.risk_score)}
                      </span>
                    )}
                    <span className={`badge-new ${selectedSession.type === 'text' ? 'text' : selectedSession.type === 'voice' ? 'voice' : 'avatar'}`}>
                      {selectedSession.type ? selectedSession.type.charAt(0).toUpperCase() + selectedSession.type.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="session-detail-summary">
                  <div className="session-detail-summary-title">Summary:</div>
                  {selectedSession.summary || "No summary available."}
                </div>

                <div className="conversation-box-new">
                  <div className="conversation-title-new">Conversation</div>
                  
                  {selectedSession.chat_messages && selectedSession.chat_messages.length > 0 ? (
                    <div className="conversation-messages-list">
                      {selectedSession.chat_messages.map((msg) => (
                        <div key={msg.id} className={`msg-new ${msg.sent_by === 'user' ? 'user' : 'bot'}`}>
                          <div className="msg-sender-new">
                            {msg.sent_by === 'user' ? 'YOU' : 'V.E.R.A.'}
                          </div>
                          <div>{msg.content}</div>
                          <div className="msg-time-new">{formatDate(msg.created_at)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:"11px", color:"#9CA3AF", textAlign:"center", padding:"20px"}}>
                      No messages recorded.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:"13px"}}>Select a session to view details</div>
            )}
          </div>

        </div>
      </div>
    );
  };

  /* ────────────────────────────
     APPOINTMENT TAB
  ──────────────────────────── */
  const renderAppointmentTab = () => {
    return (
      <div className="tab-content">
        <h2 className="content-title">Appointment</h2>
        <div className="appointment-box-new">
          {loadingAppointments ? (
             <div className="loading-box">Loading...</div>
          ) : appointments.length === 0 ? (
             <div style={{fontFamily:"'DM Sans', sans-serif", fontSize:"13px", color:"#9CA3AF"}}>No appointments found</div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
              {appointments.map((appt) => (
                <div key={appt.id} style={{fontFamily:"'DM Sans', sans-serif", fontSize:"13px"}}>
                  <strong>{formatDate(appt.next_appointment)}</strong> - 
                  Dr. {appt.profiles?.first_name || ""} {appt.profiles?.last_name || "Unknown"}
                  {appt.clinical_observations && (
                    <p style={{marginTop:"4px", color:"#6B7280"}}>{appt.clinical_observations}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-page-container">
      
      {/* ── LEFT SIDEBAR ── */}
      <div className="profile-sidebar">
        <div className="avatar-card">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="profile-avatar-img" />
          ) : (
            <FaUserCircle className="avatar-icon-placeholder" />
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button 
            className="avatar-edit-btn" 
            onClick={handleFileSelect}
            title="Change Picture"
            disabled={uploadingAvatar}
          >
            <FaEdit />
          </button>
        </div>

        <div className="profile-info-section">
          <div className="profile-info-title" style={{justifyContent: "space-between"}}>
            <span>Profile Information</span>
            {!isEditMode && (
              <button 
                onClick={handleEdit} 
                className="sidebar-btn ghost" 
                style={{padding: "2px 8px", fontSize: "10px", marginLeft:"auto", flexShrink: 0}}
              >
                Edit
              </button>
            )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">First Name</span>
            {isEditMode ? (
               <input type="text" name="first_name" className="sidebar-input" value={profile.first_name} onChange={handleInputChange} />
            ) : ( <div className="sidebar-value">{profile.first_name}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Last Name</span>
            {isEditMode ? (
               <input type="text" name="last_name" className="sidebar-input" value={profile.last_name} onChange={handleInputChange} />
            ) : ( <div className="sidebar-value">{profile.last_name}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Email</span>
            {isEditMode ? (
               <input type="email" name="email" className="sidebar-input disabled" style={{opacity: 0.6}} value={profile.email} disabled />
            ) : ( <div className="sidebar-value">{profile.email}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Username</span>
            {isEditMode ? (
               <input type="text" name="username" className="sidebar-input" value={profile.username} onChange={handleInputChange} />
            ) : ( <div className="sidebar-value">{profile.username}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Birthday</span>
            {isEditMode ? (
               <input type="date" name="birthday" className="sidebar-input" value={profile.birthday} onChange={handleInputChange} />
            ) : ( <div className="sidebar-value">{profile.birthday || "—"}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Gender</span>
            {isEditMode ? (
               <select name="gender" className="sidebar-input" value={profile.gender} onChange={handleInputChange}>
                 <option value="">Select Gender</option>
                 <option value="male">Male</option>
                 <option value="female">Female</option>
                 <option value="other">Other</option>
                 <option value="prefer_not_to_say">Prefer not to say</option>
               </select>
            ) : ( <div className="sidebar-value">{profile.gender}</div> )}
          </div>

          <div className="sidebar-field">
            <span className="sidebar-label">Phone No</span>
            {isEditMode ? (
               <input type="tel" name="contact_number" className="sidebar-input" value={profile.contact_number} onChange={handleInputChange} />
            ) : ( <div className="sidebar-value">{profile.contact_number}</div> )}
          </div>

          {isEditMode && (
            <div className="sidebar-actions" style={{flexDirection:"row", marginTop:"8px"}}>
              <button className="sidebar-btn" style={{flex:1}} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              <button className="sidebar-btn ghost" style={{flex:1}} onClick={handleCancel}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="profile-main">
        
        <div className="profile-main-header">
          <h1 className="profile-name">
            {profile.first_name} {profile.last_name}
          </h1>
          
          <div className="privacy-settings-box">
            <span className="ps-title">PRIVACY SETTINGS</span>
            <div className="ps-toggles">
              <span>STORE: {profile.permit_store ? "ON" : "OFF"}</span>
              <span>ANALYZE: {profile.permit_analyze ? "ON" : "OFF"}</span>
            </div>
          </div>
        </div>

        <div className="custom-tabs">
          <button 
            className={`custom-tab ${activeTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            <FaUserShield /> Privacy
          </button>
          <button 
            className={`custom-tab ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            <FaRegCommentDots /> Sessions
          </button>
          <button 
            className={`custom-tab ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <FaRegClipboard /> Appoinment
          </button>
        </div>

        <div className="profile-tab-content">
          {activeTab === "privacy" && renderPrivacyTab()}
          {activeTab === "sessions" && renderSessionsTab()}
          {activeTab === "appointments" && renderAppointmentTab()}
        </div>

      </div>

    </div>
  );
};

export default Profile;