import React, { useState, useEffect } from "react";
import { MdPeople, MdCheckCircle, MdWifi, MdVerified, MdAdd, MdSettings, MdNotifications, MdFolder, MdBarChart } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, AreaChart, Area, Legend } from "recharts";
import axiosInstance from "../../utils/axios.instance.js";
import "../Admin/Dashboard.css"; // Same CSS

const RISK_COLORS = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarRiskStats, setAvatarRiskStats] = useState(null);
  const [avatarRiskLoading, setAvatarRiskLoading] = useState(true);
  const [sessionUsageStats, setSessionUsageStats] = useState(null);
  const [sessionUsageLoading, setSessionUsageLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/admin/users/get-all-users", {
          params: {
            limit: 1000,
            page: 1,
            exclude_roles: "admin",
          },
        });

        const usersData = response.data.users || [];
        const totalCount = response.data.pagination?.totalUsers || 0;

        setTotalUsers(totalCount);

        const sortedUsers = usersData
          .sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateB - dateA;
          })
          .slice(0, 5);

        const activities = sortedUsers.map((user) => ({
          user: user.profile?.username || user.email || "Unknown",
          action: "User registered",
          time: formatTimeAgo(new Date(user.created_at)),
          email: user.email,
        }));

        setRecentActivity(activities);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(`Failed to fetch users data: ${err.response?.data?.message || err.message || "Unknown error"}`);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, []);

  useEffect(() => {
    const fetchAvatarRiskStats = async () => {
      try {
        setAvatarRiskLoading(true);
        const res = await axiosInstance.get("/admin/users/avatar-risk-stats");
        setAvatarRiskStats(res.data);
      } catch (err) {
        console.error("Error fetching avatar risk stats:", err);
        setAvatarRiskStats({ byLevel: { low: 0, moderate: 0, high: 0, critical: 0 }, total: 0 });
      } finally {
        setAvatarRiskLoading(false);
      }
    };
    const fetchSessionUsageStats = async () => {
      try {
        setSessionUsageLoading(true);
        const res = await axiosInstance.get("/admin/users/session-usage-stats");
        setSessionUsageStats(res.data);
      } catch (err) {
        console.error("Error fetching session usage stats:", err);
        setSessionUsageStats({ byType: [], byVoice: [], byAvatarAgent: [], byAnimalAvatar: [] });
      } finally {
        setSessionUsageLoading(false);
      }
    };
    fetchAvatarRiskStats();
    fetchSessionUsageStats();

    // Mock trend data for visualization
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const mockTrends = months.map(m => ({
      name: m,
      sessions: Math.floor(Math.random() * 50) + 20,
      engagement: Math.floor(Math.random() * 30) + 40
    }));
    setTrendData(mockTrends);
  }, []);

  const stats = [
    { 
      label: "Total Users", 
      value: loading ? "..." : totalUsers.toLocaleString(), 
      icon: <MdPeople />, 
      change: "+12%",
      onClick: () => navigate("/psychology/users")
    },
    { 
      label: "Active Sessions", 
      value: avatarRiskLoading ? "..." : (avatarRiskStats?.total?.toLocaleString() || "0"), 
      icon: <MdCheckCircle />, 
      change: "Lifetime",
      onClick: () => navigate("/psychology/users") // Or reports if exists
    },
    { 
      label: "Critical Risk (Today)", 
      value: avatarRiskLoading ? "..." : (avatarRiskStats?.todayByLevel?.critical?.toString() || "0"), 
      icon: <MdBarChart />, 
      change: avatarRiskStats?.todayByLevel?.critical > 0 ? "Action Required" : "Stable",
      onClick: () => navigate("/psychology/users")
    },
    { 
      label: "System Status", 
      value: error ? "Issues" : "Healthy", 
      icon: <MdVerified />, 
      change: error ? "Check Logs" : "100%",
      onClick: null
    },
  ];

  const chartData = avatarRiskStats
    ? [
      { name: "Low", sessions: avatarRiskStats.byLevel?.low ?? 0, color: RISK_COLORS.low },
      { name: "Moderate", sessions: avatarRiskStats.byLevel?.moderate ?? 0, color: RISK_COLORS.moderate },
      { name: "High", sessions: avatarRiskStats.byLevel?.high ?? 0, color: RISK_COLORS.high },
      { name: "Critical", sessions: avatarRiskStats.byLevel?.critical ?? 0, color: RISK_COLORS.critical },
    ]
    : [];

  const usageColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f97316"];
  const renderUsageChart = (data, emptyText) => (
    data && data.length > 0 ? (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [value, "Sessions"]} />
          <Bar dataKey="sessions" name="Sessions" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={usageColors[index % usageColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <p className="chart-empty">{emptyText}</p>
    )
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Psychology Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        {error && <p style={{ color: "#ff6b6b", marginTop: "10px" }}>{error}</p>}
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card" 
            onClick={stat.onClick}
            style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.label === "System Status" && error ? "negative" : "positive"}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="activity-card chart-card-full">
          <h2 className="activity-title">Total sessions – risk distribution</h2>
          {avatarRiskLoading ? (
            <p className="chart-loading">Loading chart...</p>
          ) : avatarRiskStats && avatarRiskStats.total > 0 ? (
            <>
              <div className="avatar-risk-summary">
                <span className="avatar-risk-total">Total sessions analyzed: {avatarRiskStats.total}</span>
                {avatarRiskStats.averageScore != null && (
                  <span className="avatar-risk-avg">Avg risk score: {avatarRiskStats.averageScore}</span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [value, "Sessions"]} />
                  <Bar dataKey="sessions" name="Sessions" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="chart-empty">No avatar session data yet. Risk levels appear after conversations are analyzed.</p>
          )}
        </div>

        <div className="activity-card chart-card-full">
          <h2 className="activity-title">User Engagement Trends</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
              />
              <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
              <Legend verticalAlign="top" height={36}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="activity-card chart-card-full">
          <h2 className="activity-title">Most Used AI Features</h2>
          {sessionUsageLoading ? (
            <p className="chart-loading">Loading usage chart...</p>
          ) : (
            renderUsageChart(sessionUsageStats?.byType, "No session usage data yet.")
          )}
        </div>

        <div className="activity-card chart-card-full">
          <h2 className="activity-title">Most Used Voice AI Companion</h2>
          {sessionUsageLoading ? (
            <p className="chart-loading">Loading voice usage...</p>
          ) : (
            renderUsageChart(sessionUsageStats?.byVoice, "No Voice AI companion metadata yet.")
          )}
        </div>

        <div className="activity-card chart-card-full">
          <h2 className="activity-title">Most Used Agent AI Avatar</h2>
          {sessionUsageLoading ? (
            <p className="chart-loading">Loading agent usage...</p>
          ) : (
            renderUsageChart(sessionUsageStats?.byAvatarAgent, "No Agent AI avatar metadata yet.")
          )}
        </div>

        <div className="activity-card chart-card-full">
          <h2 className="activity-title">Most Used Animal Avatar AI</h2>
          {sessionUsageLoading ? (
            <p className="chart-loading">Loading animal avatar usage...</p>
          ) : (
            renderUsageChart(sessionUsageStats?.byAnimalAvatar, "No Animal Avatar AI metadata yet.")
          )}
        </div>

        <div className="activity-card">
          <h2 className="activity-title">Recent Activity - New Users</h2>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-user">{activity.user}</div>
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              ))
            ) : loading ? (
              <p style={{ padding: "20px", textAlign: "center" }}>Loading recent users...</p>
            ) : (
              <p style={{ padding: "20px", textAlign: "center" }}>No recent users found</p>
            )}
          </div>
        </div>

        <div className="quick-actions-card">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-list">
            <button className="quick-action-btn" onClick={() => navigate("/psychology/users")}>
              <span className="quick-action-icon"><MdPeople /></span>
              <span>Manage Users</span>
            </button>
            <button className="quick-action-btn" onClick={() => navigate("/psychology/resources")}>
              <span className="quick-action-icon"><MdFolder /></span>
              <span>View Resources</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
