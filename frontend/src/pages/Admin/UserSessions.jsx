import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserSessions.css";
import { MdArrowBack, MdSort, MdChevronLeft, MdChevronRight, MdDelete, MdImage, MdCheckBox, MdCheckBoxOutlineBlank, MdCalendarToday, MdBarChart, MdPsychology, MdFitnessCenter } from "react-icons/md";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, Legend } from "recharts";
import axiosInstance from "../../utils/axios.instance";
import Skeleton from "../../components/Skeleton";
import RiskBadge from "../../components/RiskBadge";
import SessionCard from "../../components/SessionCard";
import SessionTable from "../../components/SessionTable";
import ViewToggle from "../../components/ViewToggle";
import FilterChips from "../../components/FilterChips";

const UserSessions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState("card");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest / highest risk first
  const [sortBy, setSortBy] = useState("date"); // "date" = recent to past, "risk" = by risk score

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 9,
    hasNext: false,
    hasPrev: false,
  });

  // Filter state
  const [typeFilter, setTypeFilter] = useState(["voice", "text", "Avatar"]);
  const [riskFilters, setRiskFilters] = useState([]);

  // Resource assignment state
  const [availableResources, setAvailableResources] = useState([]);
  const [assignedResources, setAssignedResources] = useState([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Reports state
  const [reportsLoading, setReportsLoading] = useState(false);
  const [aiUsageStats, setAiUsageStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    voiceSessions: 0,
    textSessions: 0,
    avatarSessions: 0,
  });
  const [activitiesData, setActivitiesData] = useState({
    moodEntries: 0,
    sleepEntries: 0,
    breathingSessions: 0,
  });
  const [dailyEmotions, setDailyEmotions] = useState([]);
  const [emotionWords, setEmotionWords] = useState({});
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [pagination.currentPage, typeFilter, riskFilters]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSessions(),
      fetchUserInfo(),
      fetchAvailableResources(),
      fetchAssignedResources(),
    ]);
    setLoading(false);
  };

  // Fetch reports data
  const fetchReportsData = async () => {
    setReportsLoading(true);
    try {
      // Fetch all sessions for the user (without pagination to get complete stats)
      const allSessionsRes = await axiosInstance.get(
        `/admin/users/get-sessions-by-user/${userId}?page=1&limit=1000&type=all`
      );
      const allSessions = allSessionsRes.data.sessions || [];

      // Calculate AI usage stats
      const stats = {
        totalSessions: allSessions.length,
        totalMessages: 0,
        voiceSessions: allSessions.filter((s) => s.type === "voice").length,
        textSessions: allSessions.filter((s) => s.type === "text").length,
        avatarSessions: allSessions.filter((s) => s.type === "Avatar").length,
      };

      // Fetch messages with emotion data from voice and avatar sessions only
      // (Hume AI is used for voice/avatar sessions)
      const voiceAndAvatarSessions = allSessions.filter(
        (s) => s.type === "voice" || s.type === "Avatar"
      );

      const emotionDataByDay = {};
      let totalMessages = 0;
      let sessionsWithEmotions = 0;
      let messagesWithEmotions = 0;

      for (const session of voiceAndAvatarSessions) {
        try {
          const chatRes = await axiosInstance.get(`/sessions/fetch-chat/${session.id}`);
          const messages = chatRes.data.chat || [];
          totalMessages += messages.length;

          // Helper: Supabase may return message_emotion as array or single object
          const getEmotionArr = (m) => {
            const em = m.message_emotion;
            if (!em) return [];
            return Array.isArray(em) ? em : [em];
          };

          // Process messages with emotion data
          messages.forEach((msg) => {
            // Only process user messages (emotions are detected from user voice)
            if (msg.sent_by === "user") {
              const emotionArr = getEmotionArr(msg);

              if (emotionArr.length > 0) {
                const emotion = emotionArr[0];
                messagesWithEmotions++;

                // Use message created_at, fallback to session created_at
                const date = new Date(msg.created_at || session.created_at).toISOString().split("T")[0];

                if (!emotionDataByDay[date]) {
                  emotionDataByDay[date] = {
                    date,
                    sad: 0,
                    angry: 0,
                    happy: 0,
                    disgust: 0,
                    fearful: 0,
                    neutral: 0,
                    surprised: 0,
                    calm: 0,
                    doubt: 0,
                    confusion: 0,
                  };
                }

                // Aggregate emotion scores (sum all emotion values)
                Object.keys(emotionDataByDay[date]).forEach((key) => {
                  if (key !== "date" && emotion[key] != null && typeof emotion[key] === "number") {
                    emotionDataByDay[date][key] += emotion[key] || 0;
                  }
                });
              }
            }
          });

          // Check if this session had any messages with emotions
          const sessionHasEmotions = messages.some(
            (msg) => msg.sent_by === "user" && getEmotionArr(msg).length > 0
          );
          if (sessionHasEmotions) {
            sessionsWithEmotions++;
          }
        } catch (e) {
          console.error(`Error fetching chat for session ${session.id}:`, e);
        }
      }

      console.log("Emotion detection stats:", {
        totalVoiceAvatarSessions: voiceAndAvatarSessions.length,
        sessionsWithEmotions,
        messagesWithEmotions,
        daysWithData: Object.keys(emotionDataByDay).length,
      });

      stats.totalMessages = totalMessages;

      // Convert emotion data to array format for chart
      const dailyEmotionArray = Object.values(emotionDataByDay)
        .map((dayData) => {
          // Find dominant emotion for each day
          const emotions = Object.keys(dayData)
            .filter((key) => key !== "date")
            .map((emotion) => ({
              emotion,
              value: dayData[emotion],
            }))
            .sort((a, b) => b.value - a.value);

          // Format date for display (MM/DD)
          const dateObj = new Date(dayData.date);
          const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;

          return {
            date: formattedDate,
            fullDate: dayData.date,
            ...dayData,
            dominantEmotion: emotions[0]?.emotion || "neutral",
          };
        })
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate))
        .slice(-30); // Last 30 days

      setAiUsageStats(stats);
      setDailyEmotions(dailyEmotionArray);

      // Fetch unified activities data (Mood, Sleep, Breath)
      try {
        const activitiesRes = await axiosInstance.get(`/admin/users/get-user-activities/${userId}`);
        const activities = activitiesRes.data?.activities || [];

        const counts = {
          moodEntries: activities.filter(a => a.activity_type === 'mood').length,
          sleepEntries: activities.filter(a => a.activity_type === 'sleep').length,
          breathingSessions: activities.filter(a => a.activity_type === 'breath').length,
        };

        setActivitiesData(counts);
      } catch (e) {
        console.error("Error fetching activity data:", e);
      }

      // Fetch emotion-hinting words
      try {
        const emotionWordsRes = await axiosInstance.get(`/admin/users/get-emotion-words/${userId}`);
        setEmotionWords(emotionWordsRes.data.emotionWords || {});
      } catch (e) {
        console.error("Error fetching emotion words:", e);
        setEmotionWords({});
      }
    } catch (e) {
      console.error("Error fetching reports data:", e);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await axiosInstance.get(
        `/admin/users/get-user-info/${userId}`
      );
      const { profile } = res.data;
      console.log(profile);
      setUserInfo(profile);
    } catch (e) {
      console.error("Error fetching user info:", e);
      alert("Failed to load user information");
    }
  };

  const fetchSessions = async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append("page", pagination.currentPage);
      params.append("limit", pagination.limit);

      // Type filter: if both are selected or none, use "all"
      if (typeFilter.length === 1) {
        params.append("type", typeFilter[0]);
      } else {
        params.append("type", "all");
      }

      // Risk filter
      if (riskFilters.length > 0) {
        params.append("riskLevels", riskFilters.join(","));
      }

      const res = await axiosInstance.get(
        `/admin/users/get-sessions-by-user/${userId}?${params.toString()}`
      );
      const { sessions: fetchedSessions, pagination: paginationData } = res.data;
      console.log(fetchedSessions, paginationData);
      setSessions(sortSessions(fetchedSessions, sortBy, sortOrder));
      setPagination(paginationData);
    } catch (e) {
      console.error("Error fetching sessions:", e);
      alert("Failed to load sessions");
    }
  };

  const sortSessions = (sessionList, by, order) => {
    return [...sessionList].sort((a, b) => {
      if (by === "date") {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return order === "desc" ? dateB - dateA : dateA - dateB;
      }
      const scoreA = a.risk_score ?? -1;
      const scoreB = b.risk_score ?? -1;
      return order === "desc" ? scoreB - scoreA : scoreA - scoreB;
    });
  };

  const handleSortByChange = (by) => {
    setSortBy(by);
    setSessions(sortSessions(sessions, by, sortOrder));
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    setSessions(sortSessions(sessions, sortBy, newOrder));
  };

  const handleTypeFilterToggle = (value) => {
    setTypeFilter((prev) => {
      if (prev.includes(value)) {
        const newFilters = prev.filter((f) => f !== value);
        // Keep at least one or reset to both
        return newFilters.length === 0 ? ["voice", "text", "Avatar"] : newFilters;
      } else {
        return [...prev, value];
      }
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const handleRiskFilterToggle = (value) => {
    setRiskFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((f) => f !== value);
      } else {
        return [...prev, value];
      }
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Resource assignment functions
  const fetchAvailableResources = async () => {
    try {
      const res = await axiosInstance.get("/resources");
      setAvailableResources(res.data.resources || []);
    } catch (e) {
      console.error("Error fetching available resources:", e);
    }
  };

  const fetchAssignedResources = async () => {
    try {
      const res = await axiosInstance.get(`/resources/get-assignments/${userId}`);
      setAssignedResources(res.data.assignments || []);
    } catch (e) {
      console.error("Error fetching assigned resources:", e);
    }
  };

  const handleResourceSelect = (resourceId) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resourceId)
        ? prev.filter((id) => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleAssignResources = async () => {
    if (selectedResourceIds.length === 0) return;

    setAssigning(true);
    try {
      // Assign each selected resource
      for (const resourceId of selectedResourceIds) {
        await axiosInstance.post("/resources/assign-resource", {
          user_id: userId,
          resource_id: resourceId,
        });
      }

      alert(`Successfully assigned ${selectedResourceIds.length} resource(s)`);
      setSelectedResourceIds([]);
      await fetchAssignedResources();
    } catch (e) {
      console.error("Error assigning resources:", e);
      alert(e.response?.data?.message || "Failed to assign resources");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to remove this resource assignment?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/resources/delete-assignment/${assignmentId}`);
      alert("Resource assignment removed successfully");
      await fetchAssignedResources();
    } catch (e) {
      console.error("Error removing assignment:", e);
      alert(e.response?.data?.message || "Failed to remove assignment");
    }
  };

  const getRiskStats = () => {
    const stats = {
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      notAssessed: 0,
    };

    sessions.forEach((session) => {
      if (!session.risk_level) {
        stats.notAssessed++;
      } else {
        stats[session.risk_level.toLowerCase()]++;
      }
    });

    return stats;
  };

  const getOverallRisk = () => {
    if (sessions.length === 0) return { level: null, score: 0 };

    const assessedSessions = sessions.filter((s) => s.risk_score != null);
    if (assessedSessions.length === 0) return { level: null, score: 0 };

    // Calculate average risk score
    const avgScore =
      assessedSessions.reduce((sum, s) => sum + s.risk_score, 0) /
      assessedSessions.length;

    // Determine overall level based on average score (0-100 scale)
    let level = "low";
    if (avgScore >= 70) level = "critical";
    else if (avgScore >= 50) level = "high";
    else if (avgScore >= 30) level = "moderate";

    return { level, score: avgScore };
  };

  const riskStats = getRiskStats();
  const overallRisk = getOverallRisk();

  return (
    <div className="user-sessions-outer-container">
      <div className="user-sessions-container">
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 32 }}>
          {/* Sidebar with Back button */}
          <div style={{ minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <button
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg text-[#667eea] text-[15px] font-medium shadow-sm border border-[#e2e8f0] hover:bg-[#f5f5ff] transition-all"
              style={{ marginBottom: 16, width: '100%' }}
              onClick={() => navigate(-1)}
            >
              <MdArrowBack className="text-xl" />
              <span>Back</span>
            </button>
          </div>
          {/* Main header */}
          <div style={{ flex: 1 }}>
            <h1 className="page-title">
              User <span className="gradient-text">Sessions</span>
            </h1>
            <p className="page-subtitle">View and manage user activity, risk assessments, and reports</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="design-section user-profile-section">
          {loading ? (
            <div className="flex items-center gap-5">
              <Skeleton variant="avatar" width="80px" height="80px" />
              <div className="flex-1">
                <Skeleton variant="title" width="200px" />
                <Skeleton variant="text" width="300px" />
              </div>
            </div>
          ) : userInfo ? (
            <div className="flex items-center gap-6">
              <img
                src={userInfo.avatar_url || "https://via.placeholder.com/80"}
                alt={userInfo.username}
                className="w-20 h-20 rounded-full object-cover border-[3px] border-indigo-50 shadow-sm"
              />
              <div className="flex-1">
                <h2 className="section-title mb-1">
                  {userInfo.username || userInfo.email}
                </h2>
                <p className="text-base text-gray-600 mb-3">{userInfo.email}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                  <span className="bg-gray-50 px-2 py-1 rounded">ID: {userInfo.id}</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Role: {userInfo.role}</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Joined: {new Date(userInfo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                  <span>Privacy Settings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${userInfo.permit_store ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                    STORE: {userInfo.permit_store ? "ON" : "OFF"}
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${userInfo.permit_analyze ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"}`}>
                    ANALYZE: {userInfo.permit_analyze ? "ON" : "OFF"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Risk Assessment Section */}
        <div className="design-section user-risk-section">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
            <div>
              <h3 className="section-title mb-1">Overall Risk Assessment</h3>
              <p className="text-sm text-gray-500">
                Analysis based on {sessions.filter((s) => s.risk_score != null).length} sessions
              </p>
            </div>
            <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Risk Score</div>
                <div className="text-3xl font-bold text-gray-800">
                  {overallRisk.score.toFixed(0)}
                  <span className="text-lg text-gray-300">/100</span>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</div>
                <RiskBadge level={overallRisk.level} size="lg" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-50 pt-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Risk Distribution</div>
            <div className="flex flex-wrap gap-3">
              {[
                { level: "low", count: riskStats.low },
                { level: "moderate", count: riskStats.moderate },
                { level: "high", count: riskStats.high },
                { level: "critical", count: riskStats.critical },
                { level: null, count: riskStats.notAssessed }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-sm">
                  <RiskBadge level={stat.level} />
                  <span className="text-sm font-bold text-gray-700">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <div className="design-section user-reports-section">
          <div className="user-analytics-container bg-white p-8 rounded-lg shadow-md mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-title mb-0 flex items-center gap-2">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <MdBarChart className="text-xl text-indigo-600" />
                </div>
                User Analytics
              </h3>
              <button
                onClick={() => {
                  if (!showReports) {
                    fetchReportsData();
                  }
                  setShowReports(!showReports);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 transition-all shadow-md active:scale-95"
              >
                {showReports ? "Hide Analytics" : "View Analytics"}
              </button>
            </div>

            {showReports && (
              <div className="space-y-8">
                {reportsLoading ? (
                  <div className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
                  </div>
                ) : (
                  <>
                    {/* AI Usage Statistics */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MdPsychology className="text-lg" />
                        AI Usage Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
                          <div className="text-2xl font-bold text-indigo-600">{aiUsageStats.totalSessions}</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Total Messages</div>
                          <div className="text-2xl font-bold text-blue-600">{aiUsageStats.totalMessages}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Voice Sessions</div>
                          <div className="text-2xl font-bold text-purple-600">{aiUsageStats.voiceSessions}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Text Sessions</div>
                          <div className="text-2xl font-bold text-green-600">{aiUsageStats.textSessions}</div>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Avatar Sessions</div>
                          <div className="text-2xl font-bold text-pink-600">{aiUsageStats.avatarSessions}</div>
                        </div>
                      </div>
                    </div>

                {/* Emotion-Hinting Words Section */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-base font-semibold text-gray-800 mb-4">
                    Emotion-Hinting Words Detected
                  </h4>
                  {Object.keys().length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <p className="text-gray-500">No emotion-hinting words detected yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Words that indicate emotions will appear here as the user interacts.</p>
                    </div>

                    {/* Daily Emotion Detection Chart */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-base font-semibold text-gray-800 mb-4">
                        Daily Emotion Detection (Hume AI Voice Analysis)
                      </h4>
                      {dailyEmotions.length === 0 ? (
                        <div className="bg-gray-50 p-8 rounded-lg text-center">
                          <p className="text-gray-500 font-medium">No emotion data available yet.</p>
                          <p className="text-sm text-gray-400 mt-2">
                            Emotions are detected from <strong>voice</strong> and <strong>avatar</strong> sessions using Hume AI Prosody model.
                          </p>
                          <div className="mt-4 text-xs text-gray-500 space-y-1">
                            <p>• Make sure you're using voice or avatar sessions (not text chat)</p>
                            <p>• Emotions are detected from your voice recordings</p>
                            <p>• Voice sessions: {aiUsageStats.voiceSessions} | Avatar sessions: {aiUsageStats.avatarSessions}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                              data={dailyEmotions}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={dailyEmotions.length > 14 ? Math.floor(dailyEmotions.length / 14) : 0}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === "date") return null;
                                  return [value.toFixed(2), name.charAt(0).toUpperCase() + name.slice(1)];
                                }}
                                labelFormatter={(label) => `Date: ${label}`}
                              />
                              <Legend />
                              <Bar dataKey="happy" stackId="a" fill="#10b981" name="Happy" />
                              <Bar dataKey="sad" stackId="a" fill="#3b82f6" name="Sad" />
                              <Bar dataKey="angry" stackId="a" fill="#ef4444" name="Angry" />
                              <Bar dataKey="neutral" stackId="a" fill="#9ca3af" name="Neutral" />
                              <Bar dataKey="calm" stackId="a" fill="#06b6d4" name="Calm" />
                              <Bar dataKey="fearful" stackId="a" fill="#f59e0b" name="Fearful" />
                              <Bar dataKey="surprised" stackId="a" fill="#8b5cf6" name="Surprised" />
                              <Bar dataKey="disgust" stackId="a" fill="#ec4899" name="Disgust" />
                              <Bar dataKey="doubt" stackId="a" fill="#a855f7" name="Doubt" />
                              <Bar dataKey="confusion" stackId="a" fill="#f59e0b" name="Confusion" />
                            </BarChart>
                          </ResponsiveContainer>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Emotion scores detected from voice sessions using Hume AI Prosody model. Values represent aggregated emotion scores per day.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Emotion-Hinting Words Section */}
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-base font-semibold text-gray-800 mb-4">
                        Emotion-Hinting Words Detected
                      </h4>
                      {Object.keys(emotionWords).length === 0 ? (
                        <div className="bg-gray-50 p-8 rounded-lg text-center">
                          <p className="text-gray-500">No emotion-hinting words detected yet.</p>
                          <p className="text-sm text-gray-400 mt-1">Words that indicate emotions will appear here as the user interacts.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.entries(emotionWords).map(([emotion, data]) => {
                            const emotionColors = {
                              sad: "bg-blue-50 border-blue-200 text-blue-800",
                              angry: "bg-red-50 border-red-200 text-red-800",
                              happy: "bg-green-50 border-green-200 text-green-800",
                              fearful: "bg-orange-50 border-orange-200 text-orange-800",
                              surprised: "bg-purple-50 border-purple-200 text-purple-800",
                              disgust: "bg-pink-50 border-pink-200 text-pink-800",
                              calm: "bg-cyan-50 border-cyan-200 text-cyan-800",
                              neutral: "bg-gray-50 border-gray-200 text-gray-800",
                              doubt: "bg-violet-50 border-violet-200 text-violet-800",
                              confusion: "bg-amber-50 border-amber-200 text-amber-800",
                            };
                            const colorClass = emotionColors[emotion] || emotionColors.neutral;

                            return (
                              <div key={emotion} className={`p-4 rounded-lg border-2 ${colorClass}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-bold text-sm uppercase">{emotion}</h5>
                                  <span className="text-xs font-semibold bg-white px-2 py-1 rounded">
                                    {data.count} words
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {data.words.slice(0, 8).map((word, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-white px-2 py-0.5 rounded font-medium"
                                    >
                                      {word}
                                    </span>
                                  ))}
                                  {data.words.length > 8 && (
                                    <span className="text-xs text-gray-500 px-2 py-0.5">
                                      +{data.words.length - 8} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Words detected from user messages that indicate emotional states. These words help identify patterns in emotional expression.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Available Resources Section */}
        <div className="user-resources-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Assign Resources</h3>
            <button
              onClick={handleAssignResources}
              disabled={selectedResourceIds.length === 0 || assigning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedResourceIds.length > 0 && !assigning
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              {assigning ? "Assigning..." : `Assign Selected (${selectedResourceIds.length})`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {availableResources.length === 0 ? (
                <p className="text-sm text-gray-500">No resources available</p>
              ) : (
                availableResources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`shrink-0 w-[180px] bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${selectedResourceIds.includes(resource.id)
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200"
                      }`}
                    onClick={() => handleResourceSelect(resource.id)}
                  >
                    <div className="relative">
                      {resource.image_url ? (
                        <img
                          src={resource.image_url}
                          alt={resource.title}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <MdImage className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        {selectedResourceIds.includes(resource.id) ? (
                          <MdCheckBox className="w-6 h-6 text-blue-600 bg-white rounded" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="w-6 h-6 text-gray-400 bg-white rounded" />
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      {resource.category && (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                          {resource.category}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                        {resource.title}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assigned Resources Section */}
        <div className="user-assigned-section">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Assigned Resources ({assignedResources.length})
          </h3>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2">
              {assignedResources.length === 0 ? (
                <p className="text-sm text-gray-500">No resources assigned yet</p>
              ) : (
                assignedResources.map((assignment) => {
                  const resource = availableResources.find((r) => r.id === assignment.resource_id);
                  if (!resource) return null;

                  return (
                    <div
                      key={assignment.id}
                      className="shrink-0 w-[180px] bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-lg relative"
                    >
                      <div className="relative">
                        {resource.image_url ? (
                          <img
                            src={resource.image_url}
                            alt={resource.title}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <MdImage className="w-12 h-12 text-white opacity-50" />
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-md"
                          title="Remove assignment"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-3">
                        {resource.category && (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-2">
                            {resource.category}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {resource.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Sessions ({pagination.totalSessions})
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "date"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500"
                    }`}
                  onClick={() => handleSortByChange("date")}
                >
                  <MdCalendarToday className="text-lg" />
                  Date
                </button>
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === "risk"
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500"
                    }`}
                  onClick={() => handleSortByChange("risk")}
                >
                  <MdSort className="text-lg" />
                  Risk
                </button>
              </div>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-lg text-gray-600 text-sm font-medium border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                onClick={handleSortOrderToggle}
              >
                <MdSort className="text-lg" />
                <span>
                  {sortBy === "date"
                    ? sortOrder === "desc"
                      ? "Newest first"
                      : "Oldest first"
                    : sortOrder === "desc"
                      ? "Highest Risk First"
                      : "Lowest Risk First"}
                </span>
              </button>
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FilterChips
              label="Session Type"
              filters={[
                { label: "Voice", value: "voice" },
                { label: "Text", value: "text" },
                { label: "Avatar", value: "Avatar" },
              ]}
              activeFilters={typeFilter}
              onFilterToggle={handleTypeFilterToggle}
            />
            <FilterChips
              label="Risk Level"
              filters={[
                { label: "Low", value: "low" },
                { label: "Moderate", value: "moderate" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
              ]}
              activeFilters={riskFilters}
              onFilterToggle={handleRiskFilterToggle}
            />
          </div>
        </div>

        {loading ? (
          <div
            className={
              view === "card"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                : ""
            }
          >
            {view === "card" ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))
            ) : (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <Skeleton variant="table-row" count={6} />
              </div>
            )}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white py-[60px] px-10 rounded-xl shadow-sm text-center">
            <p className="text-base text-gray-400">
              No sessions found for this user.
            </p>
          </div>
        ) : view === "card" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages} • Total:{" "}
                  {pagination.totalSessions} sessions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasPrev
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <MdChevronLeft className="text-lg" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasNext
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <span>Next</span>
                    <MdChevronRight className="text-lg" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <SessionTable sessions={sessions} />
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 rounded-xl shadow-sm">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages} • Total:{" "}
                  {pagination.totalSessions} sessions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasPrev
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <MdChevronLeft className="text-lg" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${pagination.hasNext
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <span>Next</span>
                    <MdChevronRight className="text-lg" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserSessions;
