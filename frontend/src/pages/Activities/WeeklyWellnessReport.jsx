import React, { useState, useEffect } from "react";
import {
  LineChart,
  PieChart,
  BarChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Bar,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosInstance from "../../utils/axios.instance";

const WeeklyWellnessReport = () => {
  const sanitizePdfText = (value) =>
    String(value ?? "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E\n\r\t]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const emotionColorMap = {
    "Very Sad": "#3B82F6",
    Sad: "#6366F1",
    Neutral: "#9CA3AF",
    Happy: "#FACC15",
    "Very Happy": "#F59E0B",
    Angry: "#EF4444",
    Anxious: "#FB923C",
    Tired: "#8D6E63",
    Relaxed: "#66BB6A",
    Calm: "#26A69A",
    Unknown: "#94A3B8",
  };

  const fallbackPalette = [
    "#EC4899",
    "#14B8A6",
    "#8B5CF6",
    "#06B6D4",
    "#EAB308",
    "#F97316",
    "#22C55E",
    "#0EA5E9",
  ];

  const getEmotionColor = (emotion) => {
    if (emotionColorMap[emotion]) return emotionColorMap[emotion];

    const key = String(emotion || "Unknown");
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }

    return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
  };

  const [moodCounts, setMoodCounts] = useState({});
  const [sleepData, setSleepData] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [breathingData, setBreathingData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [isCloseButtonHovered, setIsCloseButtonHovered] = useState(false);

  useEffect(() => {
    loadSleepData();
    loadMoodData();
    loadBreathingHistory();
  }, []);

  const getStoredArray = (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return [];
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseDurationToHours = (duration) => {
    if (typeof duration === "number") return duration;
    if (!duration || typeof duration !== "string") return 0;

    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minutesMatch = duration.match(/(\d+)\s*m/i);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return hours + minutes / 60;
  };

  const loadSleepData = async () => {
    try {
      const parsedData = getStoredArray("sleepData");
      if (parsedData.length > 0) {
        const sortedHistory = [...parsedData].sort(
          (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
        );
        setSleepData(sortedHistory);
        return;
      }

      setSleepData([]);
    } catch (error) {
      console.error("Error loading sleep history:", error);
    }
  };

  const loadMoodData = async () => {
    try {
      const moodHistory = getStoredArray("moodHistory");
      const moodEntries = getStoredArray("moodEntries");

      const localMoodData = [...moodHistory, ...moodEntries];

      if (localMoodData.length > 0) {
        processMoodData(localMoodData);
        return;
      }

      const response = await axiosInstance.get("/moods/retrieve-daily-moods");
      const moodData = response?.data?.moods || [];

      if (moodData && moodData.length > 0) {
        processMoodData(moodData);
      } else {
        setMoodCounts({});
        console.log("No mood data found");
      }
    } catch (error) {
      console.error("Error loading mood data:", error);
    }
  };

  const processMoodData = (logs) => {
    const moodScoreMap = {
      1: "Very Sad",
      2: "Sad",
      3: "Neutral",
      4: "Happy",
      5: "Very Happy",
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const counts = logs.reduce((acc, log) => {
      const logDate = log.timestamp || log.created_at || log.date;
      if (logDate && new Date(logDate) < sevenDaysAgo) {
        return acc;
      }

      const moodLabel =
        (typeof log.mood === "string" && log.mood) ||
        (log.mood && typeof log.mood === "object" && log.mood.mood) ||
        moodScoreMap[log.mood_score] ||
        "Unknown";

      acc[moodLabel] = (acc[moodLabel] || 0) + 1;
      return acc;
    }, {});

    setMoodCounts(counts);
  };

  const loadBreathingHistory = async () => {
    try {
      const savedHistory = localStorage.getItem("breathingHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        const groupedData = groupByDay(parsedHistory);
        setBreathingData(groupedData);
      }
    } catch (error) {
      console.error("Error loading breathing history:", error);
    }
  };

  const groupByDay = (history) => {
    const grouped = {};
    history.forEach((entry) => {
      const date = entry.date;
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  };

  // Prepare data for charts
  const sleepChartData = sleepData.map((entry) => {
    if (!entry.duration) return { date: entry.date, duration: 0 };

    const totalHours = parseDurationToHours(entry.duration);
    const formattedDate = (entry.date || entry.created_at || "").toString();

    return {
      date: formattedDate.slice(5), // Show MM/DD format
      fullDate: formattedDate,
      duration: totalHours,
      sleepTime: entry.sleepTime || entry.sleep_time,
      wakeTime: entry.wakeTime || entry.wake_time,
    };
  });

  const pieData = Object.keys(moodCounts).map((key, index) => ({
    name: key,
    value: moodCounts[key],
    color: getEmotionColor(key),
  }));

  const breathingChartData = Object.keys(breathingData).map((date) => ({
    date,
    sessions: breathingData[date],
  }));

  const getSleepMessage = (duration) => {
    if (duration >= 8 && duration <= 10) {
      return "Good sleep: 8-10 hours is ideal. Keep it up!";
    } else if (duration > 10) {
      return "Oversleeping: More than 10 hours is not healthy. Try to maintain a balanced schedule!";
    } else {
      return "Lack of sleep: Less than 8 hours is insufficient. Prioritize your rest for better health!";
    }
  };

  const analyzeSleepTrend = () => {
    if (sleepData.length < 6) return "Not enough data to analyze trends.";

    let improving = 0;
    let declining = 0;

    for (let i = 1; i < sleepData.length; i++) {
      const prev = parseDurationToHours(sleepData[i - 1].duration);
      const current = parseDurationToHours(sleepData[i].duration);
      if (current > prev) improving++;
      else if (current < prev) declining++;
    }

    if (improving > declining) {
      return "Your sleep is improving! Keep up the good habits.";
    } else if (declining > improving) {
      return "Your sleep is decreasing. Try to get more consistent rest.";
    } else {
      return "Your sleep pattern is stable, but ensure it's within the recommended range.";
    }
  };

  const handleDataPointClick = (data) => {
    if (data && data.activePayload) {
      const entry = data.activePayload[0].payload;
      setModalContent({
        date: entry.fullDate,
        sleepTime: entry.sleepTime,
        wakeTime: entry.wakeTime,
        duration: entry.duration.toFixed(1),
        message: getSleepMessage(entry.duration),
      });
      setShowModal(true);
    }
  };

  const interpretBreathingData = (count) => {
    if (count === 0)
      return "Mababang relaxation activity. Maaring hindi mo pa nakasanayan o hindi mo pa kailangan mag-relax ngayon.";
    if (count >= 1 && count <= 4)
      return "Moderate stress management. Ginagamit mo ito bilang paraan para kumalma sa ilang stressful moments.";
    if (count >= 5 && count <= 7)
      return "High stress o intentional relaxation. Marahil ay mataas ang stress level mo o ginagawa mo ito bilang habit.";
    return "Possible anxiety o extreme relaxation practice. Kung sobra-sobra ito, baka kailangan mong tingnan ang iyong stress levels.";
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(46, 125, 50);
    doc.text("Weekly Wellness Report", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      105,
      28,
      { align: "center" }
    );

    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Mood Distribution (Past 7 Days)", 14, 42);

    const moodTableData = pieData.length
      ? pieData.map((item) => [sanitizePdfText(item.name), String(item.value)])
      : [["No data", "0"]];

    autoTable(doc, {
      startY: 46,
      head: [["Mood", "Count"]],
      body: moodTableData,
      theme: "striped",
      headStyles: { fillColor: [46, 125, 50] },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Sleep Duration Report", 14, (doc.lastAutoTable?.finalY || 46) + 14);

    const sleepTableData = sleepChartData.length
      ? sleepChartData.map((entry) => [
          sanitizePdfText(entry.fullDate || entry.date),
          `${Number(entry.duration || 0).toFixed(1)} h`,
          sanitizePdfText(entry.sleepTime || "N/A"),
          sanitizePdfText(entry.wakeTime || "N/A"),
        ])
      : [["No data", "0.0 h", "N/A", "N/A"]];

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 46) + 18,
      head: [["Date", "Duration", "Sleep Time", "Wake Time"]],
      body: sleepTableData,
      theme: "striped",
      headStyles: { fillColor: [46, 125, 50] },
      margin: { left: 14, right: 14 },
    });

    doc.setFontSize(11);
    doc.setTextColor(70, 70, 70);
    doc.text(
      `Sleep trend: ${sanitizePdfText(analyzeSleepTrend())}`,
      14,
      (doc.lastAutoTable?.finalY || 46) + 10
    );

    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Breathing Sessions Per Day", 14, (doc.lastAutoTable?.finalY || 46) + 22);

    const breathingTableData = breathingChartData.length
      ? breathingChartData.map((entry) => [sanitizePdfText(entry.date), String(entry.sessions)])
      : [["No data", "0"]];

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 46) + 26,
      head: [["Date", "Sessions"]],
      body: breathingTableData,
      theme: "striped",
      headStyles: { fillColor: [46, 125, 50] },
      margin: { left: 14, right: 14 },
    });

    const maxSessions = breathingChartData.length
      ? Math.max(...breathingChartData.map((d) => d.sessions))
      : 0;

    doc.setFontSize(11);
    doc.setTextColor(70, 70, 70);
    doc.text(
      `Breathing insight: ${sanitizePdfText(interpretBreathingData(maxSessions))}`,
      14,
      (doc.lastAutoTable?.finalY || 46) + 10,
      { maxWidth: 180 }
    );

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

    const dateStr = new Date().toISOString().split("T")[0];
    doc.save(`weekly-wellness-report-${dateStr}.pdf`);
  };

  const CustomModal = ({ show, onClose, content }) => {
    if (!show) return null;

    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <h3 style={styles.modalTitle}>Sleep Details</h3>
          <p style={styles.modalText}><strong>Date:</strong> {content.date}</p>
          <p style={styles.modalText}><strong>Sleep Time:</strong> {content.sleepTime}</p>
          <p style={styles.modalText}><strong>Wake Time:</strong> {content.wakeTime}</p>
          <p style={styles.modalText}><strong>Duration:</strong> {content.duration} hours</p>
          <p style={styles.modalText}><strong>Analysis:</strong> {content.message}</p>
          <p style={styles.modalQuote}>"Rest is the best investment for a productive tomorrow!"</p>
          <button 
            style={{
              ...styles.closeButton,
              ...(isCloseButtonHovered ? styles.closeButtonHover : {})
            }}
            onMouseEnter={() => setIsCloseButtonHovered(true)}
            onMouseLeave={() => setIsCloseButtonHovered(false)}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Styles object
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#E8F5E9',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '0 20px',
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    backButton: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#2E7D32',
      marginRight: '20px',
      padding: '8px 16px',
      borderRadius: '5px',
      transition: 'background-color 0.3s',
    },
    backButtonHover: {
      backgroundColor: 'rgba(46, 125, 50, 0.1)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#2E7D32',
      margin: 0,
    },
    cardsContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    card: {
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      width: '100%',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#388E3C',
      marginBottom: '20px',
      textAlign: 'center',
    },
    chartContainer: {
      overflowX: 'auto',
      padding: '10px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '300px',
    },
    noData: {
      textAlign: 'center',
      color: '#666',
      fontSize: '14px',
      padding: '20px',
    },
    trendAnalysis: {
      textAlign: 'center',
      marginTop: '15px',
      fontWeight: 'bold',
      color: '#2E7D32',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '5px',
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
      color: '#2E7D32',
      marginTop: 0,
      marginBottom: '20px',
      fontSize: '24px',
    },
    modalText: {
      margin: '10px 0',
      lineHeight: 1.6,
      color: '#333',
    },
    modalQuote: {
      fontStyle: 'italic',
      color: '#666',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #eee',
    },
    closeButton: {
      backgroundColor: '#2E7D32',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '20px',
      transition: 'background-color 0.3s',
    },
    closeButtonHover: {
      backgroundColor: '#1B5E20',
    },
    // Chart wrapper for better layout
    chartWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <button
          style={{
            ...styles.backButton,
            ...(isBackButtonHovered ? styles.backButtonHover : {})
          }}
          onMouseEnter={() => setIsBackButtonHovered(true)}
          onMouseLeave={() => setIsBackButtonHovered(false)}
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
        <h1 style={styles.title}>Weekly Wellness Report</h1>
        <button
          onClick={downloadPDF}
          style={{
            backgroundColor: '#2E7D32',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            marginLeft: 'auto',
          }}
        >
          Download PDF
        </button>
      </div>

      <CustomModal
        show={showModal}
        onClose={() => setShowModal(false)}
        content={modalContent}
      />

      <div style={styles.cardsContainer}>
        {/* Mood Distribution Card */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Mood Distribution (Past 7 Days)</h2>
          {pieData.length > 0 ? (
            <div style={styles.chartWrapper}>
              <div style={styles.chartContainer}>
                <PieChart width={400} height={300} data={pieData}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
            </div>
          ) : (
            <p style={styles.noData}>No mood data available for the past week.</p>
          )}
        </div>

        {/* Sleep Duration Card */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Sleep Duration Report</h2>
          {sleepChartData.length > 0 ? (
            <div style={styles.chartWrapper}>
              <div style={styles.chartContainer}>
                <LineChart
                  width={800}
                  height={300}
                  data={sleepChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  onClick={handleDataPointClick}
                >
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#50C878"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Tooltip />
                </LineChart>
              </div>
              <p style={styles.trendAnalysis}>{analyzeSleepTrend()}</p>
            </div>
          ) : (
            <p style={styles.noData}>No sleep data available.</p>
          )}
        </div>

        {/* Breathing Sessions Card */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Breathing Sessions Per Day</h2>
          {breathingChartData.length > 0 ? (
            <div style={styles.chartWrapper}>
              <div style={styles.chartContainer}>
                <BarChart
                  width={800}
                  height={300}
                  data={breathingChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Bar dataKey="sessions" fill="#1E88E5" />
                  <Tooltip />
                </BarChart>
              </div>
              <p style={styles.trendAnalysis}>
                {breathingChartData.length > 0
                  ? interpretBreathingData(
                      Math.max(...breathingChartData.map((d) => d.sessions))
                    )
                  : "Wala pang sapat na datos para sa analysis."}
              </p>
            </div>
          ) : (
            <p style={styles.noData}>No breathing data available.</p>
          )}
        </div>
      </div>

      {/* Add responsive styles via style tag */}
      <style>{`
        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }
          .title {
            font-size: 24px;
          }
          .card {
            padding: 15px;
          }
          .section-title {
            font-size: 18px;
          }
          .modal-content {
            padding: 20px;
            width: 95%;
          }
        }

        @media (max-width: 600px) {
          .chart-container {
            margin: 0 -10px;
          }
        }

        /* Scrollbar styles */
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: #4CAF50;
          border-radius: 4px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #45a049;
        }

        /* Chart container scrollbar */
        .chart-container::-webkit-scrollbar {
          height: 8px;
        }
        .chart-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .chart-container::-webkit-scrollbar-thumb {
          background: #4CAF50;
          border-radius: 4px;
        }
        .chart-container::-webkit-scrollbar-thumb:hover {
          background: #45a049;
        }
      `}</style>
    </div>
  );
};

export default WeeklyWellnessReport;