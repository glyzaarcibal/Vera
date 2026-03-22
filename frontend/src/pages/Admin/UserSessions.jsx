import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserSessions.css";
import { MdArrowBack, MdSort, MdChevronLeft, MdChevronRight, MdDelete, MdImage, MdCheckBox, MdCheckBoxOutlineBlank, MdCalendarToday, MdBarChart, MdPsychology, MdFitnessCenter } from "react-icons/md";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, Legend, LineChart, Line, ScatterChart, Scatter, ZAxis, PieChart, Pie } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/axios.instance";
import Skeleton from "../../components/Skeleton";
import RiskBadge from "../../components/RiskBadge";
import SessionCard from "../../components/SessionCard";
import SessionTable from "../../components/SessionTable";
import ViewToggle from "../../components/ViewToggle";
import FilterChips from "../../components/FilterChips";
import ReusableModal from "../../components/ReusableModal";

const UserSessions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState("card");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest / highest risk first
  const [sortBy, setSortBy] = useState("date"); // "date" = recent to past, "risk" = by risk score
  const [notification, setNotification] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
  const [sessionRiskHistory, setSessionRiskHistory] = useState([]);
  const [detailedActivities, setDetailedActivities] = useState({ mood: [], sleep: [], diary: [], medication: [], breath: [] });

  useEffect(() => {
    fetchData();
    fetchReportsData();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [pagination.currentPage, typeFilter, riskFilters, sortBy, sortOrder]);

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

  const downloadUserPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.text("Vera User Analysis Report", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on: ${timestamp}`, 105, 28, { align: "center" });

      // --- USER PROFILE SECTION ---
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text("1. User Profile", 14, 45);
      
      const profileData = [
        ["Username", userInfo?.username || "N/A"],
        ["Email", userInfo?.email || "N/A"],
        ["Role", userInfo?.role || "user"],
        ["Status", userInfo?.status || "Active"],
        ["Gender", userInfo?.gender || "Not specified"],
        ["Birthday", userInfo?.birthday || userInfo?.date_of_birth ? new Date(userInfo.birthday || userInfo.date_of_birth).toLocaleDateString() : "Not specified"],
        ["Contact", userInfo?.contact_number || userInfo?.phone || "Not specified"],
        ["Joined Date", userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "N/A"]
      ];

      autoTable(doc, {
        startY: 50,
        head: [["Field", "Details"]],
        body: profileData,
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
        styles: { fontSize: 9 },
      });

      // --- EMOTION WORDS SECTION ---
      const emotionWordsEntries = Object.entries(emotionWords);
      if (emotionWordsEntries.length > 0) {
        doc.setFontSize(16);
        doc.text("2. Emotion-Hinting Words Detected", 14, (doc.lastAutoTable?.finalY || 50) + 15);
        
        const wordsData = emotionWordsEntries.map(([emotion, words]) => [
          emotion.charAt(0).toUpperCase() + emotion.slice(1),
          Array.isArray(words) 
            ? words.map(w => typeof w === 'object' ? (w.word || w.text || String(w)) : w).join(", ") 
            : String(words)
        ]);

        autoTable(doc, {
          startY: (doc.lastAutoTable?.finalY || 50) + 20,
          head: [["Emotion", "Detected Words / Phrases"]],
          body: wordsData,
          theme: "striped",
          headStyles: { fillColor: [219, 39, 119], fontSize: 10 }, // Pink 600
          styles: { fontSize: 9 },
        });
      }

      // --- RISK PROGRESSION CHART ---
      if (sessionRiskHistory.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text("3. Session Risk Progression", 14, 20);

        // Simple manual chart drawing
        const chartX = 20;
        const chartY = 30;
        const chartW = 170;
        const chartH = 60;
        
        doc.setDrawColor(229, 231, 235);
        doc.line(chartX, chartY, chartX, chartY + chartH); // Y Axis
        doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH); // X Axis
        
        const maxRisk = 100;
        const stepX = chartW / Math.max(sessionRiskHistory.length - 1, 1);
        
        doc.setDrawColor(239, 68, 68); // Red-500
        doc.setLineWidth(0.8);
        sessionRiskHistory.forEach((point, i) => {
          const px = chartX + (i * stepX);
          const py = chartY + chartH - ((point.score / maxRisk) * chartH);
          
          doc.setFillColor(239, 68, 68);
          doc.circle(px, py, 1.2, "F");
          
          if (i > 0) {
            const prevPx = chartX + ((i - 1) * stepX);
            const prevPy = chartY + chartH - ((sessionRiskHistory[i-1].score / maxRisk) * chartH);
            doc.line(prevPx, prevPy, px, py);
          }
        });

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Risk Score (0-100)", chartX - 5, chartY - 5);
        doc.text("High Risk", chartX + chartW + 2, chartY + (chartH * 0.3));
        doc.text("Low Risk", chartX + chartW + 2, chartY + (chartH * 0.9));
        
        // --- MOOD DISTRIBUTION ---
        const moodCounts = {};
        detailedActivities.mood.forEach(m => {
          const type = m.moodType || "Neutral";
          moodCounts[type] = (moodCounts[type] || 0) + 1;
        });
        
        const moodChartData = Object.entries(moodCounts).map(([name, count]) => ({ name, count }));
        
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text("4. Mood Statistics", 14, chartY + chartH + 25);
        
        autoTable(doc, {
          startY: chartY + chartH + 30,
          head: [["Mood State", "Logged Frequency"]],
          body: moodChartData.map(d => [d.name, String(d.count)]),
          theme: "striped",
          headStyles: { fillColor: [139, 92, 246] }, // Violet 500
        });
      }

      // --- ACTIVITY DETAILS ---
      // Page for Sleep & Breath
      doc.addPage();
      doc.setFontSize(16);
      doc.text("5. Wellness Activity Log", 14, 20);

      // Sleep Table
      doc.setFontSize(12);
      doc.text("A. Sleep Patterns", 14, 30);
      autoTable(doc, {
        startY: 35,
        head: [["Date", "Time", "Duration (Hours)"]],
        body: detailedActivities.sleep.map(s => [s.date, s.time, String(s.hours)]),
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] }, // Blue 500
      });

      // Breath Table
      doc.text("B. Breathing Sessions", 14, (doc.lastAutoTable?.finalY || 35) + 15);
      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 35) + 20,
        head: [["Date", "Time", "Duration (Seconds)"]],
        body: detailedActivities.breath.map(b => [b.date, b.time, String(b.duration)]),
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
      });

      // Page for Diary & Medication
      doc.addPage();
      doc.setFontSize(12);
      doc.text("C. Diary Entry Patterns", 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [["Date", "Timestamp", "Activity Level"]],
        body: detailedActivities.diary.map(d => [d.date, d.time, "Observation recorded"]),
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11] }, // Amber 500
      });

      if (detailedActivities.medication.length > 0) {
        doc.text("D. Medication History", 14, (doc.lastAutoTable?.finalY || 25) + 15);
        autoTable(doc, {
          startY: (doc.lastAutoTable?.finalY || 25) + 20,
          head: [["Date", "Name", "Dosage", "Status"]],
          body: detailedActivities.medication.map(m => [m.date, m.name, m.dosage, m.status]),
          theme: "grid",
          headStyles: { fillColor: [239, 68, 68] }, // Red 500
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Vera Report - Confidential - Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }

      const filename = `UserAnalysis_${userInfo?.username || "Report"}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("PDF Export Error:", error);
      setNotification({
        isOpen: true,
        title: "Export Failed",
        message: "Failed to generate the enhanced report. Please check data availability.",
        type: "error"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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

      const riskHistory = allSessions
        .filter((s) => s.risk_score != null)
        .map((s) => ({
          date: new Date(s.created_at).toLocaleDateString(),
          time: new Date(s.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          score: s.risk_score,
          level: s.risk_level,
          id: s.id
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessionRiskHistory(riskHistory);

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

      // Fetch unified activities data (Mood, Sleep, Breath, Diary, Medication)
      try {
        const activitiesRes = await axiosInstance.get(`/admin/users/get-user-activities/${userId}`);
        const activities = activitiesRes.data?.activities || [];

        const counts = {
          moodEntries: activities.filter(a => a.activity_type === 'mood').length,
          sleepEntries: activities.filter(a => a.activity_type === 'sleep').length,
          breathingSessions: activities.filter(a => a.activity_type === 'breath').length,
          diaryEntries: activities.filter(a => a.activity_type === 'diary').length,
        };
        setActivitiesData(counts);

        // Detailed Activity Parse
        const moodList = activities.filter(a => a.activity_type === 'mood').map(a => {
          // Extract literal text/type of mood
          let typeStr = a.data?.mood || a.data?.moodType || "Neutral";
          let type = typeof typeStr === 'string' ? typeStr.toLowerCase() : "neutral";

          let val = a.data?.moodLevel; // check if number exists natively
          if (val == null) {
            // Try to map a realistic integer score from the text value so it plots dynamically on the visual chart
            if (["happy", "joyful", "excited", "excellent", "great", "ecstatic"].includes(type)) val = 9;
            else if (["good", "fine", "relaxed", "calm", "okay", "content"].includes(type)) val = 7;
            else if (["neutral", "mixed", "average"].includes(type)) val = 5;
            else if (["sad", "down", "tired", "stressed", "anxious", "worried", "nervous"].includes(type)) val = 3;
            else if (["angry", "depressed", "miserable", "terrible", "bad", "furious", "awful"].includes(type)) val = 2;
            else val = 5; // Default catch block
          }

          // Format type back to capitalized purely for cosmetic Tooltip visuals
          if (typeof typeStr === 'string' && typeStr.length > 0) {
            typeStr = typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
          }

          return { date: new Date(a.created_at).toLocaleDateString(), time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), mood: val, moodType: typeStr };
        });

        const sleepList = activities.filter(a => a.activity_type === 'sleep').map(a => ({
          date: new Date(a.created_at).toLocaleDateString(), time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), hours: a.data?.sleepHours || a.data?.hours || a.data?.duration || 0
        }));

        const diaryList = activities.filter(a => a.activity_type === 'diary').map(a => {
          const d = new Date(a.created_at);
          return { date: d.toLocaleDateString(), time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), hourOfDay: d.getHours() + (d.getMinutes() / 60) };
        });

        const breathList = activities.filter(a => a.activity_type === 'breath').map(a => ({
          date: new Date(a.created_at).toLocaleDateString(), time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration: a.data?.durationSeconds || a.data?.duration || 0
        }));

        const medList = activities.filter(a => a.activity_type === 'medication').map(a => ({
          date: new Date(a.created_at).toLocaleDateString(), time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          name: a.data?.medicationName || a.data?.name || "Unknown Med",
          dosage: a.data?.dosage || "N/A",
          status: a.data?.status || (a.data?.taken ? "Taken" : "Missed")
        }));

        setDetailedActivities({ mood: moodList, sleep: sleepList, diary: diaryList, breath: breathList, medication: medList });
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
      setNotification({
        isOpen: true,
        title: "Analysis Failure",
        message: e.response?.data?.message || "We encountered an issue while generating the user analysis. Please try again.",
        type: "error"
      });
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
      setNotification({
        isOpen: true,
        title: "User Info Failed",
        message: e.response?.data?.message || "Failed to load user information. Please try again.",
        type: "error"
      });
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

      // Sort parameters
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await axiosInstance.get(
        `/admin/users/get-sessions-by-user/${userId}?${params.toString()}`
      );
      const { sessions: fetchedSessions, pagination: paginationData } = res.data;
      console.log(fetchedSessions, paginationData);
      setSessions(sortSessions(fetchedSessions, sortBy, sortOrder));
      setPagination(paginationData);
    } catch (e) {
      console.error("Error fetching sessions:", e);
      setNotification({
        isOpen: true,
        title: "Sessions Failed",
        message: e.response?.data?.message || "Failed to load sessions. Please try again.",
        type: "error"
      });
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

      setNotification({
        isOpen: true,
        title: "Resources Assigned",
        message: `Successfully assigned ${selectedResourceIds.length} resource(s) to the user profile.`,
        type: "success"
      });
      setSelectedResourceIds([]);
      await fetchAssignedResources();
    } catch (e) {
      console.error("Error assigning resources:", e);
      setNotification({
        isOpen: true,
        title: "Assignment Failed",
        message: e.response?.data?.message || "Failed to assign resources. Please try again.",
        type: "error"
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    setNotification({
      isOpen: true,
      title: "Confirm Removal",
      message: "Are you sure you want to remove this resource assignment? This action cannot be undone.",
      type: "confirm",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/resources/delete-assignment/${assignmentId}`);
          setNotification({
            isOpen: true,
            title: "Success",
            message: "Resource assignment removed successfully",
            type: "success"
          });
          await fetchAssignedResources();
        } catch (e) {
          console.error("Error removing assignment:", e);
          setNotification({
            isOpen: true,
            title: "Removal Failed",
            message: e.response?.data?.message || "Failed to remove assignment. Please try again.",
            type: "error"
          });
        }
      }
    });
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
    <div className="user-sessions-outer-container relative min-h-screen">
      <div className="user-sessions-container">
        {/* Header Section */}
        <div className="user-sessions-header-row flex items-center justify-between mb-10">
          <div className="flex items-center">
            <div className="user-sessions-back-col mr-6">
              <button
                className="user-sessions-back-btn flex items-center gap-2.5 bg-white border border-gray-100 px-6 py-3 rounded-2xl text-[13px] font-black shadow-sm hover:shadow-indigo-100 hover:border-indigo-100 transition-all active:scale-95 text-gray-700"
                onClick={() => navigate(-1)}
              >
                <MdArrowBack className="text-lg text-indigo-500" />
                <span>BACK</span>
              </button>
            </div>
            <div className="user-sessions-main-head">
              <h1 className="page-title text-4xl font-black text-[#1e1b4b] leading-tight tracking-tight">
                User <span className="text-indigo-600">Analysis</span>
              </h1>
              <p className="page-subtitle text-sm text-gray-500 font-bold opacity-70 mt-1">View and manage user activity, risk assessments, detailed graphs, and reports</p>
            </div>
          </div>

          <div className="user-sessions-export-actions ml-auto flex items-center gap-4">
            {!loading && !reportsLoading && userInfo && (
              <button
                className={`px-8 py-4 bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95 hover:-translate-y-0.5 ${isGeneratingPDF ? "opacity-75 cursor-wait" : ""}`}
                onClick={downloadUserPDF}
                disabled={loading || !userInfo || isGeneratingPDF}
              >
                <span className="text-[13px] tracking-widest uppercase font-black">{isGeneratingPDF ? "GENERATING..." : "DOWNLOAD USER REPORT"}</span>
              </button>
            )}
            {reportsLoading && (
              <div className="flex items-center gap-3 text-indigo-600 font-black text-[11px] animate-pulse bg-indigo-50/50 px-6 py-4 rounded-2xl border border-indigo-100/50 shadow-sm">
                <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                SYSTEM ANALYZING DATA...
              </div>
            )}
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
                  <span className="bg-gray-50 px-2 py-1 rounded">Gender: {userInfo.gender || "Not specified"}</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Birthday: {userInfo.birthday || userInfo.date_of_birth ? new Date(userInfo.birthday || userInfo.date_of_birth).toLocaleDateString() : "Not specified"}</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Contact: {userInfo.contact_number || userInfo.phone || "Not specified"}</span>
                </div>

                <div className="mt-8 border-t border-gray-50 pt-8">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 ml-1">
                    Privacy Settings
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className={`px-5 py-2 rounded-full text-xs font-black border transition-all shadow-sm ${userInfo.permit_store !== false ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600"}`}>
                      STORE: {userInfo.permit_store !== false ? "ON" : "OFF"}
                    </div>
                    <div className={`px-5 py-2 rounded-full text-xs font-black border transition-all shadow-sm ${userInfo.permit_analyze !== false ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600"}`}>
                      ANALYZE: {userInfo.permit_analyze !== false ? "ON" : "OFF"}
                    </div>
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
          <div className="user-analytics-container">
            <div className="user-analytics-head">
              <h3 className="section-title user-analytics-title">
                <div className="user-analytics-title-icon">
                  <MdBarChart className="text-xl text-indigo-600" />
                </div>
                User Analytics
              </h3>
            </div>

            <div className="user-analytics-content">
              {reportsLoading ? (
                <div className="user-analytics-loading">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading reports...</p>
                </div>
              ) : (
                <>
                  {/* AI Usage Statistics */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">
                      <MdPsychology className="text-lg" />
                      AI Usage Statistics
                    </h4>
                    <div className="user-analytics-stats-grid">
                      <div className="user-stat-card user-stat-indigo">
                        <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
                        <div className="text-2xl font-bold text-indigo-600">{aiUsageStats.totalSessions}</div>
                      </div>
                      <div className="user-stat-card user-stat-blue">
                        <div className="text-sm text-gray-600 mb-1">Total Messages</div>
                        <div className="text-2xl font-bold text-blue-600">{aiUsageStats.totalMessages}</div>
                      </div>
                      <div className="user-stat-card user-stat-purple">
                        <div className="text-sm text-gray-600 mb-1">Voice Sessions</div>
                        <div className="text-2xl font-bold text-purple-600">{aiUsageStats.voiceSessions}</div>
                      </div>
                      <div className="user-stat-card user-stat-green">
                        <div className="text-sm text-gray-600 mb-1">Text Sessions</div>
                        <div className="text-2xl font-bold text-green-600">{aiUsageStats.textSessions}</div>
                      </div>
                      <div className="user-stat-card user-stat-pink">
                        <div className="text-sm text-gray-600 mb-1">Avatar Sessions</div>
                        <div className="text-2xl font-bold text-pink-600">{aiUsageStats.avatarSessions}</div>
                      </div>
                    </div>
                  </div>


                  {/* Daily Emotion Detection Chart */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">
                      Daily Emotion Detection (Hume AI Voice Analysis)
                    </h4>
                    {dailyEmotions.length === 0 ? (
                      <div className="user-analytics-empty">
                        <p className="text-gray-500 font-medium">No emotion data available yet.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Emotions are detected from <strong>voice</strong> and <strong>avatar</strong> sessions using Hume AI Prosody model.
                        </p>
                        <div className="mt-4 text-xs text-gray-500 space-y-1">
                          <p>â€¢ Make sure you're using voice or avatar sessions (not text chat)</p>
                          <p>â€¢ Emotions are detected from your voice recordings</p>
                          <p>â€¢ Voice sessions: {aiUsageStats.voiceSessions} | Avatar sessions: {aiUsageStats.avatarSessions}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
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
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">
                      Emotion-Hinting Words Detected
                    </h4>
                    {Object.keys(emotionWords).length === 0 ? (
                      <div className="user-analytics-empty">
                        <p className="text-gray-500">No emotion-hinting words detected yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Words that indicate emotions will appear here as the user interacts.</p>
                      </div>
                    ) : (
                      <div className="user-emotion-words-grid">
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

                  {/* Session Risk Progression Graph */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Session Risk Progression</h4>
                    {sessionRiskHistory.length === 0 ? (
                      <div className="user-analytics-empty">No assessed sessions to display risk progression.</div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={sessionRiskHistory} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name, props) => [`Score: ${value}`, `Time: ${props.payload.time}`]} />
                            <Legend />
                            <Line type="monotone" dataKey="score" name="Risk Score (/100)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Mood Tracker Profile Graph */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Mood Tracker Activity</h4>
                    {detailedActivities.mood.length === 0 ? (
                      <div className="user-analytics-empty">No mood logs.</div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={detailedActivities.mood} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name, props) => [`${props.payload.moodType} (${value}/10)`, `Time: ${props.payload.time}`]} />
                            <Line type="monotone" dataKey="mood" name="Mood (0=Low, 10=High)" stroke="#10b981" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Mood Statistics Widget */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Mood Statistics (Distribution)</h4>
                    {detailedActivities.mood.length === 0 ? (
                      <div className="user-analytics-empty">No mood data for statistics.</div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={Object.entries(detailedActivities.mood.reduce((acc, curr) => {
                                  const type = curr.moodType || "Neutral";
                                  acc[type] = (acc[type] || 0) + 1;
                                  return acc;
                                }, {})).map(([name, value]) => ({ name, value }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {Object.entries(detailedActivities.mood.reduce((acc, curr) => {
                                  const type = curr.moodType || "Neutral";
                                  acc[type] = (acc[type] || 0) + 1;
                                  return acc;
                                }, {})).map(([name], index) => {
                                  const colors = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
                                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                })}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
                          {Object.entries(detailedActivities.mood.reduce((acc, curr) => {
                            const type = curr.moodType || "Neutral";
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                          }, {})).sort((a, b) => b[1] - a[1]).map(([name, count], idx) => (
                            <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                              <span className="block text-xs font-bold text-gray-400 uppercase mb-1">{name}</span>
                              <span className="text-2xl font-bold text-gray-800">{count}</span>
                              <span className="text-xs text-gray-400 ml-1">Entries</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sleep Logs Profile Graph */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Sleep Patterns</h4>
                    {detailedActivities.sleep.length === 0 ? (
                      <div className="user-analytics-empty">No sleep logs recorded.</div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={detailedActivities.sleep} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name, props) => [`${value} Hours`, `Time: ${props.payload.time}`]} />
                            <Bar dataKey="hours" name="Hours Slept" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Breath Patterns */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Breathing Sessions</h4>
                    {detailedActivities.breath.length === 0 ? (
                      <div className="user-analytics-empty">No breathing exercise data.</div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={detailedActivities.breath} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip labelFormatter={(label) => `Date: ${label}`} formatter={(value, name, props) => [`${value} Seconds`, `Time: ${props.payload.time}`]} />
                            <Bar dataKey="duration" name="Duration (s)" fill="#06b6d4" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Diary History Scatter Graph */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Diary Entry Patterns</h4>
                    {detailedActivities.diary.length === 0 ? (
                      <div className="user-analytics-empty">No diary entries found.</div>
                    ) : (
                      <div className="user-analytics-chart-wrap">
                        <ResponsiveContainer width="100%" height={300}>
                          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="category" dataKey="date" name="Date" />
                            <YAxis type="number" dataKey="hourOfDay" name="Hour of Day" domain={[0, 24]} tickFormatter={(val) => `${Math.floor(val)}:00`} />
                            <ZAxis type="number" range={[150, 150]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name, props) => { if (name === 'Hour of Day') return props.payload.time; return value; }} />
                            <Legend />
                            <Scatter name="Diary Entries (Time of Day)" data={detailedActivities.diary} fill="#f59e0b" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Medication Logging List */}
                  <div className="user-analytics-block">
                    <h4 className="user-analytics-block-title">Medication History</h4>
                    {detailedActivities.medication.length === 0 ? (
                      <div className="user-analytics-empty">No medication data.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detailedActivities.medication.map((med, idx) => (
                          <div key={idx} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                            <div>
                              <h5 className="font-bold text-gray-800 text-lg mb-1">{med.name}</h5>
                              <p className="text-xs text-gray-500 font-medium">Dosage: {med.dosage} â€¢ Time: <span className="text-blue-600">{med.time}</span> â€¢ {med.date}</p>
                            </div>
                            <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${med.status.toLowerCase() === 'taken' ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-red-100 text-red-700 ring-1 ring-red-300'}`}>{med.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Available Resources Section */}
        <div className="design-section user-resources-section">
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
        <div className="design-section user-assigned-section">
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

        <div className="design-section user-sessions-section-container">
          {/* Controls Container */}
          <div className="user-sessions-controls mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Sessions <span className="text-indigo-500 font-bold ml-1">({pagination.totalSessions})</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 flex-wrap">
                {/* Unified Sort Dropdown */}
                <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl border border-gray-200 shadow-sm">
                  <span className="text-[12px] font-black uppercase tracking-widest text-gray-500 ml-3">Sort by</span>
                  <select
                    className="bg-white text-gray-700 text-sm font-black py-2.5 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer min-w-[180px]"
                    value={`${sortBy}_${sortOrder}`}
                    onChange={(e) => {
                      const [newSort, newOrder] = e.target.value.split('_');
                      setSortBy(newSort);
                      setSortOrder(newOrder);
                    }}
                  >
                    <option value="date_desc">NEWEST FIRST</option>
                    <option value="date_asc">OLDEST FIRST</option>
                    <option value="risk_desc">HIGHEST RISK</option>
                    <option value="risk_asc">LOWEST RISK</option>
                  </select>
                </div>
                <div className="h-10 w-px bg-gray-200 hidden sm:block mx-2"></div>
                <ViewToggle view={view} onViewChange={setView} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-10 border-y-2 border-gray-50">
              <FilterChips
                label="FILTER BY TYPE"
                filters={[
                  { label: "Voice", value: "voice" },
                  { label: "Text", value: "text" },
                  { label: "Avatar", value: "Avatar" },
                ]}
                activeFilters={typeFilter}
                onFilterToggle={handleTypeFilterToggle}
              />
              <FilterChips
                label="FILTER BY RISK"
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

          {/* Sessions Content Grid/Table Area */}
          <div className="sessions-display-area">
            {loading ? (
              <div
                className={
                  view === "card"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
              <div className="bg-white py-[60px] px-10 rounded-xl shadow-sm text-center border border-dashed border-gray-200">
                <p className="text-base text-gray-400 font-medium">
                  No sessions found for this user with the current filters.
                </p>
              </div>
            ) : view === "card" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">
                      Showing Page <span className="text-gray-900 font-bold">{pagination.currentPage}</span> of <span className="text-gray-900 font-bold">{pagination.totalPages}</span> â€¢ <span className="text-indigo-600 font-bold">{pagination.totalSessions}</span> Total Sessions
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${pagination.hasPrev
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        <MdChevronLeft className="text-xl" />
                        <span>PREVIOUS</span>
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${pagination.hasNext
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        <span>NEXT</span>
                        <MdChevronRight className="text-xl" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <SessionTable sessions={sessions} />
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium">
                      Page {pagination.currentPage} of {pagination.totalPages} â€¢ Total: {pagination.totalSessions} sessions
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${pagination.hasPrev
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${pagination.hasNext
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>











        </div>

      <ReusableModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        type={notification.type}
        position="absolute"
      >
        <div className="py-2">
          <p className="text-slate-500 mb-10 font-medium leading-[1.6] text-[15px]">{notification.message}</p>
          <div className="flex justify-end gap-4">
            {notification.type === "confirm" ? (
              <>
                <button
                  onClick={() => setNotification({ ...notification, isOpen: false })}
                  className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[12px] tracking-widest transition-all active:scale-95"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (notification.onConfirm) notification.onConfirm();
                    setNotification({ ...notification, isOpen: false });
                  }}
                  className="px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-[12px] tracking-widest transition-all shadow-xl shadow-rose-100 active:scale-95"
                >
                  REMOVE
                </button>
              </>
            ) : (
              <button
                onClick={() => setNotification({ ...notification, isOpen: false })}
                className={`group relative overflow-hidden px-12 py-4 rounded-2xl font-black text-[12px] tracking-widest text-white transition-all shadow-xl active:scale-95 ${
                  notification.type === "error" ? "bg-rose-500 hover:bg-rose-600 shadow-rose-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                }`}
              >
                <span className="relative z-10 uppercase">Got it</span>
                <div className="absolute inset-x-0 h-full w-full bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            )}
          </div>
        </div>
      </ReusableModal>      </div>
    </div>
  );
};

export default UserSessions;
