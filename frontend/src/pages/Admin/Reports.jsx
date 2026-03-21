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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/axios.instance";
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

const Reports = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/admin/users/get-all-users", {
          params: {
            page: 1,
            limit: 1000,
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
              totalSessions:
                sessionsRes?.data?.pagination?.totalSessions ||
                sessionsRes?.data?.sessions?.length ||
                0,
            };
          })
        );

        const riskStatsRes = await axiosInstance.get("/admin/users/avatar-risk-stats");
        const riskStats = riskStatsRes?.data || {};

        let totalActivities = 0;
        let totalSessions = 0;
        let usersWithActivities = 0;
        let skippedUsers = 0;

        const activityTypeCounts = {};
        const weeklyActivityCounts = {};
        const userSessionTotals = [];

        userReports.forEach((entry) => {
          if (entry.status !== "fulfilled") {
            skippedUsers += 1;
            return;
          }

          const { user, activities, totalSessions: userSessions } = entry.value;
          totalActivities += activities.length;
          totalSessions += userSessions;

          userSessionTotals.push({
            name: user.profile?.username || user.email || "Unknown",
            value: userSessions,
          });

          if (activities.length > 0) {
            usersWithActivities += 1;
          }

          activities.forEach((activity) => {
            const activityType = activity.activity_type || "other";
            activityTypeCounts[activityType] = (activityTypeCounts[activityType] || 0) + 1;

            const activityDate = activity.created_at
              ? new Date(activity.created_at).toISOString().split("T")[0]
              : null;

            if (activityDate) {
              weeklyActivityCounts[activityDate] = (weeklyActivityCounts[activityDate] || 0) + 1;
            }
          });
        });

        const activityTypeData = Object.entries(activityTypeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        const riskLevelData = ["low", "moderate", "high", "critical"].map((level) => ({
          name: level,
          value: riskStats?.byLevel?.[level] ?? 0,
        }));

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

        setAggregateReport({
          loaded: true,
          totalActivities,
          totalSessions,
          usersAnalyzed: fetchedUsers.length,
          usersWithActivities,
          skippedUsers,
          averageRiskScore: riskStats.averageScore ?? null,
          avatarSessions: riskStats.total ?? 0,
          activityTypeData,
          riskLevelData,
          weeklyActivityData,
          topUsersData,
        });
        setError("");
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError(err.response?.data?.message || err.message || "Failed to load report data");
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

    // Title
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text("User Analytics Report", 105, 20, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 105, 28, { align: "center" });

    // Summary Statistics
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Summary Statistics", 14, 40);

    const summaryData = [
      ["Total Users Tracked", analytics.totalUsers.toLocaleString()],
      ["Active Users", (analytics.statusDistribution.find(item => item.name === "Active")?.value || 0).toLocaleString()],
      ["Inactive Users", (analytics.statusDistribution.find(item => item.name === "Inactive")?.value || 0).toLocaleString()],
      ["Users Analyzed (Reports)", aggregateReport.usersAnalyzed.toLocaleString()],
      ["Total Activities", aggregateReport.totalActivities.toLocaleString()],
      ["Total Sessions", aggregateReport.totalSessions.toLocaleString()],
      ["Avatar Sessions", aggregateReport.avatarSessions.toLocaleString()],
      ["Average Risk Score", aggregateReport.averageRiskScore == null ? "N/A" : String(aggregateReport.averageRiskScore)],
    ];

    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Monthly Registrations
    doc.setFontSize(14);
    doc.text("Monthly Registrations", 14, (doc.lastAutoTable?.finalY || 45) + 15);

    const monthlyData = analytics.monthlyRegistrations.map(item => [
      item.month,
      item.total
    ]);

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 45) + 20,
      head: [["Month", "Registrations"]],
      body: monthlyData,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Weekday Activity
    doc.setFontSize(14);
    doc.text("Activity by Weekday", 14, (doc.lastAutoTable?.finalY || 45) + 15);

    const weekdayData = analytics.weekdayActivity.map(item => [
      item.day,
      item.records
    ]);

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 45) + 20,
      head: [["Day", "Records"]],
      body: weekdayData,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Role Distribution
    if (analytics.roleDistribution.length > 0) {
      doc.setFontSize(14);
      doc.text("User Roles Distribution", 14, (doc.lastAutoTable?.finalY || 45) + 15);

      const roleData = analytics.roleDistribution.map(item => [
        item.name,
        item.value
      ]);

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 45) + 20,
        head: [["Role", "Count"]],
        body: roleData,
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241] },
      });
    }

    if (aggregateReport.activityTypeData.length > 0) {
      doc.setFontSize(14);
      doc.text("Top Activity Types", 14, (doc.lastAutoTable?.finalY || 45) + 15);

      const activityTypeRows = aggregateReport.activityTypeData.map((item) => [
        item.name,
        item.value,
      ]);

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY || 45) + 20,
        head: [["Activity Type", "Count"]],
        body: activityTypeRows,
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241] },
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    doc.save(`user-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Reports</h1>
          <p className="reports-subtitle">Graphs for overall user activity records and trends.</p>
        </div>
        <button
          onClick={downloadPDF}
          className="reports-download-btn"
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => !loading && (e.target.style.transform = "translateY(0)")}
        >
          📄 Download PDF Report
        </button>
      </div>

      {error && <p className="reports-error">{error}</p>}

      <div className="reports-summary-cards">
        <div className="reports-summary-card">
          <span className="reports-summary-label">Total Users Tracked</span>
          <span className="reports-summary-value">
            {loading ? "..." : analytics.totalUsers.toLocaleString()}
          </span>
        </div>
        <div className="reports-summary-card">
          <span className="reports-summary-label">Active Users</span>
          <span className="reports-summary-value">
            {loading
              ? "..."
              : (analytics.statusDistribution.find((item) => item.name === "Active")?.value || 0).toLocaleString()}
          </span>
        </div>
        <div className="reports-summary-card">
          <span className="reports-summary-label">Inactive Users</span>
          <span className="reports-summary-value">
            {loading
              ? "..."
              : (analytics.statusDistribution.find((item) => item.name === "Inactive")?.value || 0).toLocaleString()}
          </span>
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

      <div className="reports-grid">
        <div className="report-card">
          <h3 className="report-card-title">Monthly Registrations (Line)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Activity by Weekday (Bar)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weekdayActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="records" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">User Roles (Pie)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {analytics.roleDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Cumulative User Growth (Area)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.cumulativePoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#c4b5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Activity Types Across Users (Bar)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.activityTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Avatar Risk Distribution (Pie)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregateReport.riskLevelData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {aggregateReport.riskLevelData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Last 7 Days Activity (Area)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregateReport.weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="activities" stroke="#0891b2" fill="#67e8f9" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card">
          <h3 className="report-card-title">Top Users by Sessions (Bar)</h3>
          <div className="report-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateReport.topUsersData} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
