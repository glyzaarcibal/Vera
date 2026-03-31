import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../utils/axios.instance.js";
import "./Activities.css";

const Activities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const carouselRef = useRef(null);
  const [userRecords, setUserRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cardWidth = useMemo(() => (windowWidth <= 768 ? 280 : 320), [windowWidth]);
  const gap = 48; // Matches 'gap-12' in Tailwind/CSS (12 * 4 = 48)
  const shiftAmount = cardWidth + gap;

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
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/></svg>,
      path: "/activities/clipcard",
    },
    {
      id: 2,
      name: "Diary",
      description: "Write and track your daily thoughts",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
      path: "/activities/diary",
    },
    {
      id: 4,
      name: "Mood Tracker",
      description: "Track and monitor your mood",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>,
      path: "/activities/mood-tracker",
    },
    {
      id: 5,
      name: "Sleep Tracker",
      description: "Monitor your sleep patterns",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
      path: "/activities/sleep-tracker",
    },
    {
      id: 6,
      name: "Weekly Wellness Report",
      description: "View your weekly mood, sleep, and breathing insights",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
      path: "/activities/weekly-wellness-report",
    },
    {
      id: 7,
      name: "Take a Breath",
      description: "Guided breathing exercise for quick relaxation",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>,
      path: "/activities/take-a-breath",
    },
    {
      id: 8,
      name: "Medication History",
      description: "Log and track your medication records",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>,
      path: "/activities/medication-history",
    },
  ];

  const handleCarouselScroll = (direction) => {
    if (direction === "left") {
      setSelectedActivityIndex((prev) => Math.max(0, prev - 1));
    } else {
      setSelectedActivityIndex((prev) => Math.min(activities.length - 1, prev + 1));
    }
  };

  return (
    <div className="activities-container">
      <div className="activities-header">
        <h1>Activities</h1>
        <p className="activities-subtitle">
          Explore and engage with our wellness activities
        </p>
      </div>

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

      <div className="activities-carousel-wrapper">
        <div className="relative w-full flex items-center justify-center min-h-[600px]">
          {/* Left Arrow */}
          <button
            onClick={() => handleCarouselScroll("left")}
            disabled={selectedActivityIndex === 0}
            className={`absolute left-4 z-20 w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center transition-all border border-gray-100 ${selectedActivityIndex === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:scale-110 hover:shadow-2xl text-purple-600"
              }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Carousel */}
          <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
            <motion.div
              className="absolute flex items-center gap-12"
              animate={{ x: `calc(50% - ${selectedActivityIndex * shiftAmount + (cardWidth / 2)}px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {activities.map((activity, index) => {
                const isActive = index === selectedActivityIndex;
                return (
                  <motion.div
                    key={activity.id}
                    className={`activity-card-new ${isActive ? "active-focus" : "inactive-blur"}`}
                    whileHover={isActive ? { scale: 1.02, y: -10 } : {}}
                    onClick={() => {
                      if (isActive) navigate(activity.path);
                      else setSelectedActivityIndex(index);
                    }}
                  >
                    <div className="activity-card-image-circle">
                      {activity.icon}
                    </div>
                    <h3>{activity.name}</h3>
                    <p>{activity.description}</p>
                    <div className="activity-more-btn">
                      MORE
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => handleCarouselScroll("right")}
            disabled={selectedActivityIndex === activities.length - 1}
            className={`absolute right-4 z-20 w-14 h-14 rounded-2xl bg-white shadow-xl flex items-center justify-center transition-all border border-gray-100 ${selectedActivityIndex === activities.length - 1
              ? "opacity-30 cursor-not-allowed"
              : "hover:scale-110 hover:shadow-2xl text-purple-600"
              }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-3 mt-8">
          {activities.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedActivityIndex(i)}
              className={`rounded-full transition-all duration-300 ${i === selectedActivityIndex
                ? "w-8 h-2.5 bg-purple-500 shadow-md shadow-purple-200"
                : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Activities;
