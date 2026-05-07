import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { MdPsychology, MdTimeline, MdAccessTime, MdPeople, MdBarChart, MdNightsStay, MdWarning, MdNotificationsNone, MdTrendingUp, MdPerson } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/axios.instance";
import ReusableModal from "../../components/ReusableModal";
import "./Reports.css";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

const getMonthLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
};

const getWeekdayLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("default", { weekday: "short" });
};

const PsychologyReports = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: "", message: "" });
  const [error, setError] = useState("");
  const [aggregateReport, setAggregateReport] = useState({
    loaded: false,
    totalActivities: 0,
    totalSessions: 0,
    usersAnalyzed: 0,
    usersWithActivities: 0,
    skippedUsers: 0,
    averageRiskScore: null,
    avatarSessions: 0,
    activityTypeData: [],
    riskLevelData: [],
    weeklyActivityData: [],
    topUsersData: [],
    engagementScore: 0,
    dau: 0,
    wau: 0,
    avgSleep: 0,
    peakHour: "12:00 PM",
    mostUsedFeature: "N/A",
    genderDemographics: [],
    criticalUsersData: [],
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/admin/users/get-all-users", {
          params: { page: 1, limit: 1000, exclude_roles: "admin" },
        });

        const fetchedUsers = response.data?.users || [];
        setUsers(fetchedUsers);

        const userReports = await Promise.allSettled(
          fetchedUsers.map(async (user) => {
            const [activitiesRes, sessionsRes] = await Promise.all([
              axiosInstance.get(`/admin/users/get-user-activities/${user.id}`),
              axiosInstance.get(`/admin/users/get-sessions-by-user/${user.id}?page=1&limit=200&type=all`),
            ]);
            return {
              user,
              activities: activitiesRes?.data?.activities || [],
              sessions: sessionsRes?.data?.sessions || [],
              totalSessions: sessionsRes?.data?.pagination?.totalSessions || sessionsRes?.data?.sessions?.length || 0,
            };
          })
        );

        const riskStatsRes = await axiosInstance.get("/admin/users/risk-stats");
        const riskStats = riskStatsRes?.data || {};

        let totalActivities = 0;
        let totalSessions = 0;
        let usersWithActivities = 0;
        let skippedUsers = 0;
        const activityTypeCounts = {};
        const weeklyActivityCounts = {};
        const userSessionTotals = [];
        let totalSleep = 0;
        let sleepEntries = 0;
        const hourCounts = {};
        let activeToday = new Set();
        let activeThisWeek = new Set();
        const genderCounts = {};
        const dynamicRiskLevels = { low: 0, moderate: 0, high: 0, critical: 0 };
        let totalAssessedSessions = 0;
        let totalRiskScoreSum = 0;
        const criticalUsersData = [];

        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;

        userReports.forEach((entry) => {
          if (entry.status !== "fulfilled") { skippedUsers += 1; return; }

          const { user, activities, sessions: userSessionsList, totalSessions: userSessionsCount } = entry.value;
          totalActivities += activities.length;
          totalSessions += userSessionsCount;
          userSessionTotals.push({ name: user.profile?.username || user.email || "Unknown", value: userSessionsCount });
          if (activities.length > 0) usersWithActivities += 1;

          const gender = user.profile?.gender || "Unknown";
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;

          let maxUserRiskScore = 0;
          let userCriticalCount = 0;
          userSessionsList.forEach(session => {
            if (session.risk_level) {
              const level = session.risk_level.toLowerCase();
              if (dynamicRiskLevels[level] !== undefined) dynamicRiskLevels[level]++;
              if (level === 'critical') userCriticalCount++;
            }
            if (session.risk_score != null) {
              totalAssessedSessions++;
              totalRiskScoreSum += Number(session.risk_score);
              if (session.risk_score > maxUserRiskScore) maxUserRiskScore = session.risk_score;
            }
          });

          if (userCriticalCount > 0) {
            criticalUsersData.push({ name: user.profile?.username || user.email || "Unknown", sessions: userCriticalCount, score: maxUserRiskScore });
          }

          activities.forEach((activity) => {
            const activityType = activity.activity_type || "other";
            activityTypeCounts[activityType] = (activityTypeCounts[activityType] || 0) + 1;

            if (activity.created_at) {
              const actDate = new Date(activity.created_at);
              const activityDateStr = actDate.toISOString().split("T")[0];
              weeklyActivityCounts[activityDateStr] = (weeklyActivityCounts[activityDateStr] || 0) + 1;
              const hour = actDate.getHours();
              hourCounts[hour] = (hourCounts[hour] || 0) + 1;
              const diff = now - actDate;
              if (diff <= oneDay) activeToday.add(user.id);
              if (diff <= sevenDays) activeThisWeek.add(user.id);
            }

            if (activityType === 'sleep') {
              const hours = activity.data?.sleepHours || activity.data?.hours || activity.data?.duration || 0;
              if (hours > 0) { totalSleep += Number(hours); sleepEntries += 1; }
            }
          });
        });

        const activityTypeData = Object.entries(activityTypeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        const riskLevelData = ["low", "moderate", "high", "critical"].map((level) => ({
          name: level,
          value: dynamicRiskLevels[level] || (riskStats?.byLevel?.[level] ?? 0),
        }));

        const avgScore = totalAssessedSessions > 0
          ? Math.round((totalRiskScoreSum / totalAssessedSessions) * 10) / 10
          : (riskStats.averageScore ?? null);

        const today = new Date();
        const weeklyActivityData = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));
          const key = date.toISOString().split("T")[0];
          return { day: key.slice(5), activities: weeklyActivityCounts[key] || 0 };
        });

        const topUsersData = userSessionTotals.sort((a, b) => b.value - a.value).slice(0, 5);

        let peakH = 12, maxC = 0;
        for (const [h, count] of Object.entries(hourCounts)) {
          if (count > maxC) { maxC = count; peakH = h; }
        }
        const formatHour = (h) => {
          const hh = parseInt(h);
          if (hh === 0) return "12 AM";
          if (hh === 12) return "12 PM";
          return hh > 12 ? (hh - 12) + " PM" : hh + " AM";
        };

        const topFeature = activityTypeData.length > 0 ? activityTypeData[0].name.toUpperCase() : "N/A";
        const avgSlp = sleepEntries > 0 ? (totalSleep / sleepEntries).toFixed(1) : 0;
        const eScore = fetchedUsers.length > 0
          ? Math.min(100, Math.round(((usersWithActivities / fetchedUsers.length) * 50) + ((activeThisWeek.size / fetchedUsers.length) * 50)))
          : 0;

        const genderDemographics = Object.entries(genderCounts).map(([name, value]) => ({ name, value }));

        setAggregateReport({
          loaded: true, totalActivities, totalSessions,
          usersAnalyzed: fetchedUsers.length, usersWithActivities, skippedUsers,
          averageRiskScore: avgScore,
          avatarSessions: totalAssessedSessions || (riskStats.total ?? 0),
          activityTypeData, riskLevelData, weeklyActivityData, topUsersData,
          engagementScore: eScore, dau: activeToday.size, wau: activeThisWeek.size,
          avgSleep: avgSlp, peakHour: formatHour(peakH), mostUsedFeature: topFeature,
          genderDemographics,
          criticalUsersData: criticalUsersData.sort((a, b) => b.sessions - a.sessions),
        });
        setError("");
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        const msg = err.response?.data?.message || err.message || "Failed to load report data";
        setError(msg);
        setErrorModal({ isOpen: true, title: "Data Sync Failed", message: msg });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const analytics = useMemo(() => {
    const monthlyMap = new Map();
    const weekdayBase = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayMap = new Map(weekdayBase.map((day) => [day, 0]));
    const roleMap = new Map();
    const cumulativePoints = [];
    let activeCount = 0;
    let inactiveCount = 0;

    const validUsers = [...users]
      .filter((user) => user?.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    validUsers.forEach((user, index) => {
      const createdAt = user.created_at;
      const month = getMonthLabel(createdAt);
      const weekday = getWeekdayLabel(createdAt);
      const role = user?.profile?.role || "user";

      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);
      roleMap.set(role, (roleMap.get(role) || 0) + 1);

      if (user.is_anonymous) { inactiveCount += 1; } else { activeCount += 1; }
      cumulativePoints.push({ index: index + 1, users: index + 1, month });
    });

    const monthlyRegistrations = Array.from(monthlyMap.entries()).map(([month, total]) => ({ month, total }));
    const weekdayActivity = weekdayBase.map((day) => ({ day, records: weekdayMap.get(day) || 0 }));
    const roleDistribution = Array.from(roleMap.entries()).map(([name, value]) => ({ name, value }));
    const statusDistribution = [
      { name: "Active", value: activeCount },
      { name: "Inactive", value: inactiveCount },
    ];

    return { totalUsers: validUsers.length, monthlyRegistrations, weekdayActivity, roleDistribution, statusDistribution, cumulativePoints };
  }, [users]);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text("User Insights Report", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(113, 128, 150);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 28, { align: "center" });
    doc.setFontSize(14);
    doc.setTextColor(26, 32, 44);
    doc.text("Metrics Overview", 14, 45);

    const summaryData = [
      ["Total Users", analytics.totalUsers.toLocaleString()],
      ["Active Users", (analytics.statusDistribution.find(item => item.name === "Active")?.value || 0).toLocaleString()],
      ["Total Activities Recorded", aggregateReport.totalActivities.toLocaleString()],
      ["Total AI Sessions", aggregateReport.totalSessions.toLocaleString()],
      ["Average Risk Score", aggregateReport.averageRiskScore == null ? "N/A" : String(aggregateReport.averageRiskScore)],
    ];

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [102, 126, 234], fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });

    doc.save(`psychology-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="reports-page">

      {/* ── Header ── */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">User Analytics</h1>
          <p className="reports-subtitle">Comprehensive data visualization of user engagement and behavioral trends.</p>
        </div>
        {!loading && aggregateReport.loaded && (
          <button
            onClick={downloadPDF}
            disabled={loading}
            style={{
              padding: "14px 28px",
              borderRadius: "16px",
              border: "none",
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "800",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)",
              transition: "all 0.3s ease",
              opacity: loading ? 0.6 : 1,
              letterSpacing: "0.04em",
            }}
          >
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px", borderRadius: "10px" }}>
              <MdBarChart style={{ fontSize: "20px", display: "block" }} />
            </div>
            EXPORT ANALYTICS PDF
          </button>
        )}
      </div>

      <ReusableModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />

      {/* ── Intelligence Briefing ──
      <div className="briefing-banner">
        <h3 className="briefing-label">
          <span className="briefing-label-dot" />
          DASHBOARD INTELLIGENCE
        </h3>
        <p className="briefing-body">
          This <strong>Intelligence Briefing</strong> aggregates deep-learning assessments from total user interactions.
          By cross-referencing AI-driven risk scores, wellness logs, and engagement velocity, it identifies hidden
          patterns to help practitioners implement preemptive clinical strategies.
        </p>
      </div> */}

      {error && <p className="reports-error">{error}</p>}

      {/* ── AI Analytics Hub ── */}
      <div className="ai-hub-card">
        <div className="ai-hub-header">

          <div className="ai-hub-title-section">
            <h2>AI Analytics Hub</h2>
            <p className="ai-hub-subtitle">NEURAL INTELLIGENCE REPORT</p>
          </div>
        </div>

        <div className="hub-grid">
          {/* Left: Strategic Risk Alerts */}
          <div className="hub-left">
            <div className="flex items-center mb-6">
              <div className="alert-badge">
                <div className="pulse-dot" />
                STRATEGIC RISK ALERTS
              </div>
              <span className="real-time-label">REAL-TIME</span>
            </div>

            <div className="critical-intervention">
              <MdWarning className="warning-icon" />
              <div>
                <div className="critical-title">Critical Intervention Needed</div>
                <div className="critical-desc">
                  {aggregateReport.criticalUsersData.length} user {aggregateReport.criticalUsersData.length === 1 ? 'identity' : 'identities'} flagged with severe psychological stress indicators.
                </div>
              </div>
            </div>

            <div className="risk-badges">
              <div className="risk-user-badge">
                <MdPerson style={{ fontSize: "18px" }} />
                {aggregateReport.criticalUsersData.length} User{aggregateReport.criticalUsersData.length === 1 ? '' : 's'} at Risk
              </div>
              <div className="risk-trajectory-badge">
                <MdTrendingUp style={{ fontSize: "18px", color: "#818cf8" }} />
                Elevated Risk Trajectory
              </div>
            </div>
          </div>

          <div className="hub-divider" />

          {/* Right: Predictive Forecasts */}
          <div className="hub-right">
            <div className="forecast-badge">
              PREDICTIVE FORECASTS
            </div>

            <div className="forecast-item">
              <div className="forecast-icon-box">
                -{aggregateReport.criticalUsersData.length > 0 ? "1" : "0"}
              </div>
              <div className="forecast-content">
                <h5>Projected Resilience Drop</h5>
                <p>Early emotional markers suggest increased anxiety in a subset of users within the 72h window.</p>
              </div>
            </div>

            <div className="forecast-item">
              <div className="forecast-icon-box">
                <MdNotificationsNone style={{ fontSize: "22px" }} />
              </div>
              <div className="forecast-content">
                <h5>Smart Timing Recommendation</h5>
                <p>
                  Highest engagement expected at <strong>{aggregateReport.peakHour}</strong>.
                  Recommend scheduling group sessions during this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="reports-summary-cards">

        <div className="reports-summary-card">
          <div className="flex justify-between items-start">
            <span className="reports-summary-label">App Affinity</span>
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><MdTimeline size={20} /></div>
          </div>
          <div>
            <div className="reports-summary-value">{loading ? "—" : `${aggregateReport.engagementScore}%`}</div>
            <div className="card-sub-label text-indigo-500">Habit Strength Index</div>
          </div>
        </div>

        <div className="reports-summary-card">
          <div className="flex justify-between items-start">
            <span className="reports-summary-label">Retention Ratio</span>
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl"><MdPeople size={20} /></div>
          </div>
          <div>
            <div className="reports-summary-value">{loading ? "—" : `${aggregateReport.dau}/${aggregateReport.wau}`}</div>
            <div className="card-sub-label text-emerald-500">DAU / WAU Efficiency</div>
          </div>
        </div>

        <div className="reports-summary-card">
          <div className="flex justify-between items-start">
            <span className="reports-summary-label">Traffic Peak</span>
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl"><MdAccessTime size={20} /></div>
          </div>
          <div>
            <div className="reports-summary-value">{loading ? "—" : aggregateReport.peakHour}</div>
            <div className="card-sub-label text-purple-500">Active Velocity Time</div>
          </div>
        </div>

        <div className="reports-summary-card">
          <div className="flex justify-between items-start">
            <span className="reports-summary-label">Sleep Avg</span>
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl"><MdNightsStay size={20} /></div>
          </div>
          <div>
            <div className="reports-summary-value">{loading ? "—" : `${aggregateReport.avgSleep}h`}</div>
            <div className="card-sub-label text-indigo-500">Wellness Recovery</div>
          </div>
        </div>

        <div className="reports-summary-card">
          <span className="reports-summary-label">Total Activities</span>
          <div className="reports-summary-value">
            {loading ? "—" : aggregateReport.totalActivities.toLocaleString()}
          </div>
        </div>

        <div className="reports-summary-card">
          <span className="reports-summary-label">Total Sessions</span>
          <div className="reports-summary-value">
            {loading ? "—" : aggregateReport.totalSessions.toLocaleString()}
          </div>
        </div>

      </div>

      {/* ── Charts Grid ── */}
      <div className="reports-grid">

        {/* User Engagement Distribution */}
        <div className="report-card lg:col-span-8">
          <div className="flex justify-between items-end mb-1">
            <div>
              <h3 className="report-card-title"><MdBarChart /> User Engagement Distribution</h3>
              <p className="report-card-desc">Relative activity volume ranked by total user sessions.</p>
            </div>
          </div>
          <div className="report-chart-wrap" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.topUsersData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 16px 40px -8px rgba(0,0,0,0.12)', padding: '14px 18px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[10, 10, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Thresholds */}
        <div className="report-card lg:col-span-4">
          <div className="mb-5">
            <h3 className="report-card-title" style={{ color: '#e11d48' }}>
              Critical Thresholds
              <span style={{
                marginLeft: 'auto', fontSize: '9px', background: '#fff1f2',
                color: '#e11d48', padding: '3px 10px', borderRadius: '999px',
                fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase'
              }}>Priority 1</span>
            </h3>
            <p className="report-card-desc">Users requiring immediate clinical oversight.</p>
          </div>
          <div style={{ height: 280 }}>
            {aggregateReport.criticalUsersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregateReport.criticalUsersData} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={90} tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip cursor={{ fill: '#fff1f2' }} contentStyle={{ borderRadius: '16px', border: 'none', padding: '12px 16px' }} />
                  <Bar dataKey="sessions" radius={[0, 10, 10, 0]} fill="#fb7185" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4" style={{ opacity: 0.35 }}>
                <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdPeople size={32} color="#94a3b8" />
                </div>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#94a3b8', textAlign: 'center' }}>Baseline Normal</p>
              </div>
            )}
          </div>
        </div>

        {/* Growth Velocity */}
        <div className="report-card lg:col-span-6">
          <h3 className="report-card-title"><MdTrendingUp /> Growth Velocity</h3>
          <p className="report-card-desc">Cumulative user growth over time.</p>
          <div className="report-chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.cumulativePoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={12} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 16px 40px -8px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#areaGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Profile Summary */}
        <div className="report-card lg:col-span-6">
          <h3 className="report-card-title"><MdPsychology /> Risk Profile Summary</h3>
          <p className="report-card-desc">Session-level risk distribution across all users.</p>
          <div className="report-chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregateReport.riskLevelData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="48%"
                  outerRadius={110}
                  innerRadius={80}
                  stroke="none"
                  paddingAngle={8}
                >
                  {aggregateReport.riskLevelData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][index % 4]} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity Velocity */}
        <div className="report-card lg:col-span-6">
          <h3 className="report-card-title"><MdTimeline /> Daily Activity Velocity</h3>
          <p className="report-card-desc">Activity volume over the last 7 days.</p>
          <div className="report-chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregateReport.weeklyActivityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={12} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 16px 40px -8px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="activities" stroke="#ef4444" strokeWidth={4} dot={{ stroke: '#ef4444', strokeWidth: 2, r: 5, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Activity Modalities */}
        <div className="report-card lg:col-span-6">
          <h3 className="report-card-title"><MdBarChart /> Top Activity Modalities</h3>
          <p className="report-card-desc">Most frequently logged activity types across users.</p>
          <div className="report-chart-wrap" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.activityTypeData} layout="vertical" margin={{ left: 0, right: 24, top: 4 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PsychologyReports;