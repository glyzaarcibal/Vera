import React, { useState, useEffect } from "react";
import { MdPeople, MdCheckCircle, MdWifi, MdVerified, MdAdd, MdSettings, MdNotifications, MdFolder } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
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
    fetchAvatarRiskStats();
  }, []);

  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: <MdPeople />, change: "+12%" },
    { label: "Active Sessions", value: "89", icon: <MdCheckCircle />, change: "+5%" },
    { label: "API Calls Today", value: "15.2K", icon: <MdWifi />, change: "+23%" },
    { label: "System Status", value: "Healthy", icon: <MdVerified />, change: "100%" },
  ];

  const chartData = avatarRiskStats
    ? [
      { name: "Low", sessions: avatarRiskStats.byLevel?.low ?? 0, color: RISK_COLORS.low },
      { name: "Moderate", sessions: avatarRiskStats.byLevel?.moderate ?? 0, color: RISK_COLORS.moderate },
      { name: "High", sessions: avatarRiskStats.byLevel?.high ?? 0, color: RISK_COLORS.high },
      { name: "Critical", sessions: avatarRiskStats.byLevel?.critical ?? 0, color: RISK_COLORS.critical },
    ]
    : [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Psychology Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        {error && <p style={{ color: "#ff6b6b", marginTop: "10px" }}>{error}</p>}
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{loading && stat.label === "Total Users" ? "..." : stat.value}</div>
              <div className="stat-change positive">{stat.change}</div>
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
            <button className="quick-action-btn">
              <span className="quick-action-icon"><MdSettings /></span>
              <span>Settings</span>
            </button>
            <button className="quick-action-btn">
              <span className="quick-action-icon"><MdNotifications /></span>
              <span>Notifications</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
