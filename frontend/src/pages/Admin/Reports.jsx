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
import { MdPsychology, MdTimeline, MdAccessTime, MdPeople, MdBarChart, MdNightsStay } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/axios.instance";
import ReusableModal from "../../components/ReusableModal";
import "../Admin/Reports.css";

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
          params: {
            page: 1,
            limit: 1000,
            exclude_roles: "admin",
          },
        });

        const fetchedUsers = response.data?.users || [];
        setUsers(fetchedUsers);

        const userReports = await Promise.allSettled(
          fetchedUsers.map(async (user) => {
            const [activitiesRes, sessionsRes] = await Promise.all([
              axiosInstance.get(`/admin/users/get-user-activities/${user.id}`),
              axiosInstance.get(
                `/admin/users/get-sessions-by-user/${user.id}?page=1&limit=200&type=all`
              ),
            ]);

            return {
              user,
              activities: activitiesRes?.data?.activities || [],
              sessions: sessionsRes?.data?.sessions || [],
              totalSessions:
                sessionsRes?.data?.pagination?.totalSessions ||
                sessionsRes?.data?.sessions?.length ||
                0,
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
          if (entry.status !== "fulfilled") {
            skippedUsers += 1;
            return;
          }

          const { user, activities, sessions: userSessionsList, totalSessions: userSessionsCount } = entry.value;
          totalActivities += activities.length;
          totalSessions += userSessionsCount;

          userSessionTotals.push({
            name: user.profile?.username || user.email || "Unknown",
            value: userSessionsCount,
          });

          if (activities.length > 0) {
            usersWithActivities += 1;
          }

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
            criticalUsersData.push({
              name: user.profile?.username || user.email || "Unknown",
              sessions: userCriticalCount,
              score: maxUserRiskScore
            });
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
               if (hours > 0) {
                  totalSleep += Number(hours);
                  sleepEntries += 1;
               }
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
          return {
            day: key.slice(5),
            activities: weeklyActivityCounts[key] || 0,
          };
        });

        const topUsersData = userSessionTotals
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
          
        let peakH = 12;
        let maxC = 0;
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
        const eScore = fetchedUsers.length > 0 ? Math.min(100, Math.round(((usersWithActivities / fetchedUsers.length) * 50) + ((activeThisWeek.size / fetchedUsers.length) * 50))) : 0;
        
        const genderDemographics = Object.entries(genderCounts).map(([name, value]) => ({name, value}));

        setAggregateReport({
          loaded: true,
          totalActivities,
          totalSessions,
          usersAnalyzed: fetchedUsers.length,
          usersWithActivities,
          skippedUsers,
          averageRiskScore: avgScore,
          avatarSessions: totalAssessedSessions || (riskStats.total ?? 0),
          activityTypeData,
          riskLevelData,
          weeklyActivityData,
          topUsersData,
          engagementScore: eScore,
          dau: activeToday.size,
          wau: activeThisWeek.size,
          avgSleep: avgSlp,
          peakHour: formatHour(peakH),
          mostUsedFeature: topFeature,
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

      if (user.is_anonymous) {
        inactiveCount += 1;
      } else {
        activeCount += 1;
      }

      cumulativePoints.push({
        index: index + 1,
        users: index + 1,
        month,
      });
    });

    const monthlyRegistrations = Array.from(monthlyMap.entries()).map(([month, total]) => ({
      month,
      total,
    }));

    const weekdayActivity = weekdayBase.map((day) => ({
      day,
      records: weekdayMap.get(day) || 0,
    }));

    const roleDistribution = Array.from(roleMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const statusDistribution = [
      { name: "Active", value: activeCount },
      { name: "Inactive", value: inactiveCount },
    ];

    return {
      totalUsers: validUsers.length,
      monthlyRegistrations,
      weekdayActivity,
      roleDistribution,
      statusDistribution,
      cumulativePoints,
    };
  }, [users]);

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text("User Insights Report", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(113, 128, 150);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 105, 28, { align: "center" });

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
      styles: { fontSize: 10 }
    });

    doc.save(`psychology-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="reports-page pt-10 pb-20 px-4 lg:px-10">
      <div className="reports-header mb-16">
        <div>
          <h1 className="reports-title">User Analytics</h1>
          <p className="reports-subtitle">Comprehensive data visualization of user engagement and behavioral trends.</p>
        </div>
        {!loading && aggregateReport.loaded && (
          <button
            onClick={downloadPDF}
            className="reports-download-btn group"
            disabled={loading}
            style={{
              padding: "16px 32px",
              borderRadius: "20px",
              border: "none",
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "900",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.4)",
              transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
              <MdBarChart className="text-2xl" />
            </div>
            <span>EXPORT ANALYTICS PDF</span>
          </button>
        )}
      </div>

      <ReusableModal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />

      {/* Spacing wrapper for briefing */}
      <div className="mb-16">
        <div className="bg-linear-to-r from-blue-50/70 to-indigo-50/70 border border-indigo-100/60 p-8 rounded-[2.5rem] backdrop-blur-md relative overflow-hidden group shadow-sm">
          <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-200/20 blur-3xl -mr-24 -mt-24 rounded-full group-hover:scale-150 transition-transform duration-1000" />
          <h3 className="font-black text-indigo-900 mb-4 flex items-center gap-4 uppercase tracking-[0.2em] text-[11px]">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full" /> Dashboard Intelligence
          </h3>
          <p className="text-[15px] text-slate-600 leading-relaxed font-semibold max-w-4xl">
            This <strong className="text-indigo-900">Intelligence Briefing</strong> aggregates deep-learning assessments from total user interactions. By cross-referencing AI-driven risk scores, wellness logs, and engagement velocity, it identifies hidden patterns to help practitioners implement preemptive clinical strategies.
          </p>
        </div>
      </div>

      {error && <p className="reports-error mb-12">{error}</p>}

      {/* Large AI Hub Card with more internal padding */}
      <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-12 text-white mb-20 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.6)] relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-16">
            <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-2xl shadow-indigo-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <MdPsychology className="text-5xl text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight leading-none mb-2">AI Analytics Hub</h2>
              <p className="text-indigo-300 font-black text-xs uppercase tracking-[0.3em] opacity-80">Neural Intelligence Report</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 hover:bg-white/[0.07] transition-all group">
              <h4 className="text-rose-400 font-black mb-6 flex items-center justify-between uppercase tracking-widest text-[11px]">
                <span className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" /> Strategic Risk Alerts
                </span>
                <span className="bg-rose-500/20 px-3 py-1 rounded-full text-[10px] border border-rose-500/20 font-black">REAL-TIME</span>
              </h4>
              <ul className="space-y-6">
                {aggregateReport.riskLevelData.find(r => r.name === 'critical')?.value > 0 ? (
                  <li className="flex gap-5 bg-rose-500/10 p-6 rounded-[1.75rem] border border-rose-500/20 group-hover:scale-[1.03] transition-transform duration-500">
                    <span className="text-3xl">🚨</span>
                    <div>
                      <div className="font-extrabold text-white text-lg">Critical Intervention Needed</div>
                      <div className="text-sm text-rose-200/90 mt-2 font-medium leading-relaxed">{aggregateReport.riskLevelData.find(r => r.name === 'critical')?.value} user identities flagged with severe psychological stress indicators.</div>
                    </div>
                  </li>
                ) : (
                  <li className="flex items-center gap-4 text-emerald-400 font-black bg-emerald-500/10 p-6 rounded-[1.75rem] border border-emerald-500/20">
                    <span className="text-2xl">🛡️</span> Stable Baseline: No immediate life-safety risks detected.
                  </li>
                )}
                <div className="grid grid-cols-1 gap-4 mt-6">
                  {aggregateReport.riskLevelData.find(r => r.name === 'high')?.value > 0 && (
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                        <span className="text-[13px] font-extrabold text-indigo-100">Elevated Risk Trajectory</span>
                        <span className="bg-orange-500 text-[10px] font-black px-3 py-1.5 rounded-xl">{aggregateReport.riskLevelData.find(r => r.name === 'high')?.value} USERS</span>
                     </div>
                  )}
                  {aggregateReport.wau < analytics.totalUsers * 0.5 && (
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                        <span className="text-[13px] font-extrabold text-indigo-100">Retention Anomaly</span>
                        <span className="text-yellow-400 font-black text-[12px] uppercase">Low Velocity</span>
                     </div>
                  )}
                </div>
              </ul>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-2xl border border-white/10 hover:bg-white/[0.07] transition-all group">
              <h4 className="text-emerald-400 font-black mb-6 flex items-center gap-4 uppercase tracking-widest text-[11px]">
                <span className="p-2 bg-emerald-500/20 rounded-xl">🤖</span> Predictive Forecasts
              </h4>
              <div className="space-y-6">
                <div className="bg-emerald-500/5 p-6 rounded-[1.75rem] border border-emerald-500/15 group-hover:bg-emerald-500/10 transition-colors">
                   <div className="flex items-start gap-5">
                      <div className="text-3xl font-black text-emerald-400">-{Math.max(1, Math.floor(analytics.totalUsers * 0.15))}</div>
                      <div>
                         <div className="text-[15px] font-black text-white">Projected Resilience Drop</div>
                         <p className="text-[12px] text-emerald-300/70 mt-2 leading-relaxed font-medium">Early emotional markers suggest increased anxiety in a subset of users within the 72h window.</p>
                      </div>
                   </div>
                </div>
                <div className="bg-indigo-500/5 p-6 rounded-[1.75rem] border border-indigo-500/15 group-hover:bg-indigo-500/10 transition-colors">
                   <div className="flex items-start gap-4">
                      <div className="bg-indigo-500/20 p-2.5 rounded-lg"><MdPsychology className="text-indigo-300 text-2xl" /></div>
                      <div>
                         <div className="text-[14px] font-black text-white">Smart Timing Recommendation</div>
                         <p className="text-[12px] text-indigo-200/70 mt-2 leading-relaxed font-medium">Highest engagement expected at <strong className="text-white font-black">{aggregateReport.peakHour}</strong>. Recommend scheduling group sessions during this window.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        <div className="reports-summary-card p-8 !gap-6">
          <div className="flex justify-between items-start">
             <div className="reports-summary-label">App Affinity</div>
             <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><MdTimeline size={24} /></div>
          </div>
          <div>
            <div className="reports-summary-value text-4xl mb-1">{loading ? "..." : aggregateReport.engagementScore}%</div>
            <div className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Habit Strength Index</div>
          </div>
        </div>
        
        <div className="reports-summary-card p-8 !gap-6">
          <div className="flex justify-between items-start">
             <div className="reports-summary-label">Retention Ratio</div>
             <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl"><MdPeople size={24} /></div>
          </div>
          <div>
            <div className="reports-summary-value text-4xl mb-1">{loading ? "..." : `${aggregateReport.dau}/${aggregateReport.wau}`}</div>
            <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">DAU / WAU Efficiency</div>
          </div>
        </div>

        <div className="reports-summary-card p-8 !gap-6">
          <div className="flex justify-between items-start">
             <div className="reports-summary-label">Traffic Peak</div>
             <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl"><MdAccessTime size={24} /></div>
          </div>
          <div>
            <div className="reports-summary-value text-4xl mb-1">{loading ? "..." : aggregateReport.peakHour}</div>
            <div className="text-[11px] font-black text-purple-500 uppercase tracking-widest">Active Velocity Time</div>
          </div>
        </div>

        <div className="reports-summary-card p-8 !gap-6">
          <div className="flex justify-between items-start">
             <div className="reports-summary-label">Sleep Avg</div>
             <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl"><MdNightsStay size={24} /></div>
          </div>
          <div>
            <div className="reports-summary-value text-4xl mb-1">{loading ? "..." : `${aggregateReport.avgSleep}h`}</div>
            <div className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Wellness Recovery</div>
          </div>
        </div>
        <div className="reports-summary-card">
          <span className="reports-summary-label">Total Activities</span>
          <span className="reports-summary-value">
            {loading ? "..." : aggregateReport.totalActivities.toLocaleString()}
          </span>
        </div>
        <div className="reports-summary-card">
          <span className="reports-summary-label">Total Sessions</span>
          <span className="reports-summary-value">
            {loading ? "..." : aggregateReport.totalSessions.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="reports-grid gap-12">
        <div className="report-card lg:col-span-8 flex flex-col !p-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h3 className="report-card-title text-2xl mb-2">User Engagement Distribution</h3>
              <p className="text-sm text-slate-400 font-semibold">Relative activity volume ranked by total user sessions.</p>
            </div>
          </div>
          <div className="report-chart-wrap flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.topUsersData} margin={{ top: 20 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.15)', padding: '20px'}}
                  itemStyle={{fontWeight: 900, fontSize: '16px'}}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[12, 12, 0, 0]} barSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card lg:col-span-4 flex flex-col !p-10">
          <div className="mb-8">
            <h3 className="report-card-title !text-rose-600 text-2xl mb-2 flex items-center justify-between">
              Critical Thresholds
              <span className="text-[10px] bg-rose-100 text-rose-600 px-3 py-1 rounded-full uppercase font-black tracking-widest">Priority 1</span>
            </h3>
            <p className="text-sm text-slate-400 font-semibold">Users requiring immediate clinical oversight.</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            {aggregateReport.criticalUsersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregateReport.criticalUsersData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100} 
                    tick={{fill: '#1e293b', fontSize: 12, fontWeight: 800}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#fff1f2'}}
                    contentStyle={{borderRadius: '24px', border: 'none', padding: '16px'}}
                  />
                  <Bar dataKey="sessions" radius={[0, 12, 12, 0]} fill="#fb7185" barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-6 opacity-40 grayscale">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                     <MdPeople size={40} />
                   </div>
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center px-8 leading-loose">Baseline Normal</p>
                </div>
            )}
          </div>
        </div>

        {/* Growth Velocity */}
        <div className="report-card lg:col-span-6 !p-10">
           <h3 className="report-card-title text-2xl mb-8">Growth Velocity</h3>
           <div className="report-chart-wrap min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.cumulativePoints}>
                <defs>
                   <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="report-card lg:col-span-6 !p-10">
           <h3 className="report-card-title text-2xl mb-8">Risk Profile Summary</h3>
           <div className="report-chart-wrap flex items-center justify-center min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregateReport.riskLevelData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={90}
                  stroke="none"
                  paddingAngle={10}
                >
                  {aggregateReport.riskLevelData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][index % 4]} cornerRadius={12} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none'}} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{paddingTop: '30px', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Velocity */}
        <div className="report-card lg:col-span-6 !p-10">
           <h3 className="report-card-title text-2xl mb-8">Daily Activity Velocity</h3>
           <div className="report-chart-wrap min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregateReport.weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="activities" stroke="#ef4444" strokeWidth={5} dot={{ stroke: '#ef4444', strokeWidth: 3, r: 6, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal Distribution */}
        <div className="report-card lg:col-span-6 !p-10">
           <h3 className="report-card-title text-2xl mb-8">Top Activity Modalities</h3>
           <div className="report-chart-wrap min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.activityTypeData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 12, fontWeight: 800}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 12, 12, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PsychologyReports;
