import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axiosInstance from "../utils/axios.instance.js";
import "./Activities.css";

const Activities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRecords, setUserRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState(null);

  const isReportsMode = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("reports") === "1" || Boolean(location.state?.showUserRecords);
  }, [location.search, location.state]);

  useEffect(() => {
    if (!isReportsMode) {
      return;
    }

    const fetchAllUsers = async () => {
      try {
        setRecordsLoading(true);
        setRecordsError(null);

        let page = 1;
        const limit = 200;
        let hasNext = true;
        const users = [];

        while (hasNext) {
          const response = await axiosInstance.get("/admin/users/get-all-users", {
            params: { page, limit },
          });

          const pageUsers = response.data?.users || [];
          const pagination = response.data?.pagination || {};

          users.push(...pageUsers);
          hasNext = Boolean(pagination.hasNext) && pageUsers.length > 0;
          page += 1;
        }

        const normalized = users
          .map((user) => ({
            id: user.id,
            email: user.email || "Unknown",
            username: user.profile?.username || user.email || "Unknown",
            createdAt: user.created_at ? new Date(user.created_at) : null,
            dateLabel: user.created_at
              ? new Date(user.created_at).toISOString().split("T")[0]
              : "Unknown",
            status: user.is_anonymous ? "Inactive" : "Active",
          }))
          .sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt ? b.createdAt.getTime() : 0;
            return dateA - dateB;
          });

        setUserRecords(normalized);
      } catch (error) {
        console.error("Failed to fetch user records:", error);
        setRecordsError(
          error.response?.data?.message ||
          error.message ||
          "Failed to load user records"
        );
      } finally {
        setRecordsLoading(false);
      }
    };

    fetchAllUsers();
  }, [isReportsMode]);

  const registrationsByDate = useMemo(() => {
    const dateMap = userRecords.reduce((accumulator, record) => {
      const key = record.dateLabel;
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [userRecords]);

  const cumulativeRegistrations = useMemo(() => {
    let runningTotal = 0;
    return registrationsByDate.map((item) => {
      runningTotal += item.count;
      return {
        ...item,
        total: runningTotal,
      };
    });
  }, [registrationsByDate]);

  const statusDistribution = useMemo(() => {
    const statusMap = userRecords.reduce(
      (accumulator, record) => {
        accumulator[record.status] = (accumulator[record.status] || 0) + 1;
        return accumulator;
      },
      { Active: 0, Inactive: 0 }
    );

    return [
      { name: "Active", value: statusMap.Active || 0 },
      { name: "Inactive", value: statusMap.Inactive || 0 },
    ];
  }, [userRecords]);

  const chartColors = ["#667eea", "#e53e3e"];

  const activities = [
    {
      id: 1,
      name: "Clipcard Game",
      description: "Test your memory with matching cards",
      icon: "🎮",
      path: "/activities/clipcard",
    },
    {
      id: 2,
      name: "Diary",
      description: "Write and track your daily thoughts",
      icon: "📔",
      path: "/activities/diary",
    },
    {
      id: 4,
      name: "Mood Tracker",
      description: "Track and monitor your mood",
      icon: "😊",
      path: "/activities/mood-tracker",
    },
    {
      id: 5,
      name: "Sleep Tracker",
      description: "Monitor your sleep patterns",
      icon: "😴",
      path: "/activities/sleep-tracker",
    },
    {
      id: 6,
      name: "Weekly Wellness Report",
      description: "View your weekly mood, sleep, and breathing insights",
      icon: "📊",
      path: "/activities/weekly-wellness-report",
    },
    {
      id: 7,
      name: "Take a Breath",
      description: "Guided breathing exercise for quick relaxation",
      icon: "🌬️",
      path: "/activities/take-a-breath",
    },
    {
      id: 8,
      name: "Medication History",
      description: "Log and track your medication records",
      icon: "💊",
      path: "/activities/medication-history",
    },
  ];

  return (
    <div className="activities-container">
      <h1>Activities</h1>
      <p className="activities-subtitle">
        Explore and engage with our wellness activities
      </p>

      {isReportsMode && (
        <div className="reports-section">
          <div className="reports-header">
            <h2>Overall User Activity Reports</h2>
            <p>All user records visualized in different graph types.</p>
          </div>

          {recordsError && <p className="reports-error">{recordsError}</p>}

          {recordsLoading ? (
            <div className="reports-loading">Loading report data...</div>
          ) : (
            <>
              <div className="reports-summary">
                <div className="reports-summary-card">
                  <span>Total Users</span>
                  <strong>{userRecords.length}</strong>
                </div>
                <div className="reports-summary-card">
                  <span>Active Users</span>
                  <strong>{statusDistribution[0]?.value || 0}</strong>
                </div>
                <div className="reports-summary-card">
                  <span>Inactive Users</span>
                  <strong>{statusDistribution[1]?.value || 0}</strong>
                </div>
              </div>

              <div className="reports-charts-grid">
                <div className="report-chart-card">
                  <h3>Registrations by Date (Bar)</h3>
                  <div className="report-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={registrationsByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Registrations" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="report-chart-card">
                  <h3>Cumulative Registrations (Line)</h3>
                  <div className="report-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cumulativeRegistrations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          name="Total Users"
                          stroke="#764ba2"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="report-chart-card">
                  <h3>User Status Distribution (Pie)</h3>
                  <div className="report-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="activities-grid">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-card"
            onClick={() => navigate(activity.path)}
          >
            <div className="activity-icon">{activity.icon}</div>
            <h3>{activity.name}</h3>
            <p>{activity.description}</p>
            <div className="activity-footer">
              <span className="activity-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Activities;
