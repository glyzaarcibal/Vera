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
import ModalPortal from "../../components/ModalPortal";

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

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/activities");
      const activities = response.data.activities || [];
      processAllActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAllActivities = (activities) => {
    // 1. Process Mood Data
    const moodScoreMap = {
      1: "Very Sad",
      2: "Sad",
      3: "Neutral",
      4: "Happy",
      5: "Very Happy",
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moodLogs = activities.filter(act => act.activity_type === "mood");
    const counts = moodLogs.reduce((acc, log) => {
      const data = log.data || {};
      const logDate = data.timestamp || log.created_at || data.date;

      if (logDate && new Date(logDate) < sevenDaysAgo) {
        return acc;
      }

      const moodLabel =
        (typeof data.mood === "string" && data.mood) ||
        (data.mood && typeof data.mood === "object" && data.mood.mood) ||
        moodScoreMap[data.mood_score] ||
        data.moodEmoji ||
        "Unknown";

      acc[moodLabel] = (acc[moodLabel] || 0) + 1;
      return acc;
    }, {});
    setMoodCounts(counts);

    // 2. Process Sleep Data
    const sleepLogs = activities
      .filter(act => act.activity_type === "sleep")
      .map(act => ({
        id: act.id,
        ...act.data
      }))
      .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
    setSleepData(sleepLogs);

    // 3. Process Breathing Data
    const breathLogs = activities
      .filter(act => act.activity_type === "breath")
      .map(act => ({
        ...act.data,
        type: act.data.type || "relaxing",
        typeLabel: act.data.typeLabel || BREATHING_TYPE_LABELS[act.data.type] || "Relaxing (6-7-8)",
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const groupedByDay = {};
    const groupedByType = {};

    breathLogs.forEach((entry) => {
      const date = entry.date;
      groupedByDay[date] = (groupedByDay[date] || 0) + 1;

      const label = entry.typeLabel || BREATHING_TYPE_LABELS[entry.type] || entry.type || "Other";
      groupedByType[label] = (groupedByType[label] || 0) + 1;
    });

    setBreathingData({
      byDay: groupedByDay,
      byType: groupedByType,
      raw: breathLogs
    });
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

  const BREATHING_TYPE_LABELS = {
    relaxing: "Relaxing (6-7-8)",
    box: "Box (4-4-4)",
    "478": "4-7-8 Calm",
    calm: "Calm (4-2-6)",
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

  const byDay = breathingData?.byDay || breathingData || {};
  const byType = breathingData?.byType || {};
  const breathingChartData = Object.keys(byDay).map((date) => ({
    date,
    sessions: byDay[date],
  }));
  const breathingByTypeChartData = Object.keys(byType).map((label) => ({
    name: label,
    sessions: byType[label],
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
    doc.setTextColor(102, 126, 234);
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
      headStyles: { fillColor: [102, 126, 234] },
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
      headStyles: { fillColor: [102, 126, 234] },
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
      headStyles: { fillColor: [102, 126, 234] },
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
      <ModalPortal>
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
      </ModalPortal>
    );
  };

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 35%, #fff0f9 65%, #f0f9ff 100%)',
      padding: '20px',
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
    },
    headerContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '20px',
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto',
      background: 'rgba(255, 255, 255, 0.85)',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)',
    },
    backButton: {
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#667eea',
      marginRight: '20px',
      padding: '8px 16px',
      borderRadius: '5px',
      transition: 'background-color 0.3s, transform 0.2s',
      fontWeight: '500',
    },
    backButtonHover: {
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      transform: 'translateX(-2px)',
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
    },
    downloadButton: {
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      padding: '10px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      marginLeft: 'auto',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
    },
    cardsContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.85)',
      padding: '20px',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)',
      width: '100%',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#667eea',
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
      color: '#667eea',
      padding: '10px',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
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
      backdropFilter: 'blur(5px)',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '20px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    },
    modalTitle: {
      color: '#667eea',
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
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '20px',
      transition: 'all 0.2s',
      fontWeight: '500',
    },
    closeButtonHover: {
      backgroundColor: '#5a67d8',
      transform: 'translateY(-2px)',
      boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)',
    },
    // Chart wrapper for better layout
    chartWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    tableHeaderCell: {
      padding: '10px 12px',
      textAlign: 'left',
      fontWeight: 'bold',
      color: '#667eea',
    },
    tableCell: {
      padding: '8px 12px',
      textAlign: 'left',
      color: '#333',
    },
  };

  return (
    <div style={styles.container}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "5%",
        width: "300px",
        height: "300px",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 8s ease-in-out infinite",
        zIndex: 1,
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        animation: "float 12s ease-in-out infinite reverse",
        zIndex: 1,
      }} />

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

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
        .modal-content::-webkit-scrollbar,
        .chart-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .modal-content::-webkit-scrollbar-track,
        .chart-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .modal-content::-webkit-scrollbar-thumb,
        .chart-container::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 4px;
        }
        .modal-content::-webkit-scrollbar-thumb:hover,
        .chart-container::-webkit-scrollbar-thumb:hover {
          background: #5a67d8;
        }
      `}</style>

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
            ...styles.downloadButton,
            ...(isCloseButtonHovered ? { transform: 'scale(1.05)' } : {})
          }}
          onMouseEnter={() => setIsCloseButtonHovered(true)}
          onMouseLeave={() => setIsCloseButtonHovered(false)}
        >
          Download PDF
        </button>
      </div>

      <CustomModal
        show={showModal}
        onClose={() => setShowModal(false)}
        content={modalContent}
      />

      {isLoading ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '50px' }}>
          <h2 style={styles.sectionTitle}>Loading Wellness Report...</h2>
          <p style={styles.noData}>Please wait while we gather your data.</p>
        </div>
      ) : (
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
                      stroke="#667eea"
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
                    <Bar dataKey="sessions" fill="#667eea" />
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

            {breathingByTypeChartData.length > 0 && (
              <>
                <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>Breathing Sessions by Type</h2>
                <div style={styles.chartWrapper}>
                  <div style={styles.chartContainer}>
                    <BarChart
                      width={800}
                      height={280}
                      data={breathingByTypeChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Bar dataKey="sessions" fill="#764ba2" name="Sessions" />
                      <Tooltip />
                    </BarChart>
                  </div>
                </div>
              </>
            )}

            {breathingData?.raw?.length > 0 && (
              <>
                <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>Recent Breathing History</h2>
                <div style={{ overflowX: "auto", maxHeight: 200, border: "1px solid rgba(102,126,234,0.2)", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ backgroundColor: "rgba(102,126,234,0.1)" }}>
                        <th style={styles.tableHeaderCell}>Date</th>
                        <th style={styles.tableHeaderCell}>Time</th>
                        <th style={styles.tableHeaderCell}>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breathingData.raw.slice(0, 10).map((entry, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(102,126,234,0.1)" }}>
                          <td style={styles.tableCell}>{entry.date}</td>
                          <td style={styles.tableCell}>{entry.time}</td>
                          <td style={styles.tableCell}>{entry.typeLabel || entry.type || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyWellnessReport;
