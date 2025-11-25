import React from "react";
import { MdPeople, MdCheckCircle, MdWifi, MdVerified, MdAdd, MdBarChart, MdSettings, MdNotifications } from "react-icons/md";
import "./Dashboard.css";

const Dashboard = () => {
  const stats = [
    { label: "Total Users", value: "1,234", icon: <MdPeople />, change: "+12%" },
    { label: "Active Sessions", value: "89", icon: <MdCheckCircle />, change: "+5%" },
    { label: "API Calls Today", value: "15.2K", icon: <MdWifi />, change: "+23%" },
    { label: "System Status", value: "Healthy", icon: <MdVerified />, change: "100%" },
  ];

  const recentActivity = [
    { user: "john_doe", action: "Logged in", time: "2 minutes ago" },
    { user: "jane_smith", action: "Updated profile", time: "15 minutes ago" },
    { user: "admin", action: "Created new user", time: "1 hour ago" },
    { user: "alice_wonder", action: "Changed password", time: "2 hours ago" },
    { user: "bob_builder", action: "Logged out", time: "3 hours ago" },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change positive">{stat.change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="activity-card">
          <h2 className="activity-title">Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-user">{activity.user}</div>
                <div className="activity-action">{activity.action}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions-card">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-list">
            <button className="quick-action-btn">
              <span className="quick-action-icon"><MdAdd /></span>
              <span>Add User</span>
            </button>
            <button className="quick-action-btn">
              <span className="quick-action-icon"><MdBarChart /></span>
              <span>View Reports</span>
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
