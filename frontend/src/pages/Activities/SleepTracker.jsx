import React, { useState, useEffect } from "react";

const generateHourOptions = () =>
  Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const generateMinuteOptions = () => ["00", "15", "30", "45"];

// Simple date picker component for web
const SimpleDatePicker = ({ selected, onDateChange, options }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(selected || new Date().toISOString().split('T')[0].replace(/-/g, '/'));

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day) => {
    const dateStr = `${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    onDateChange(dateStr);
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarEmptyCell} />);
    }

    // Fill in the days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonth.getFullYear()}/${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDate;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          style={{
            ...styles.calendarCell,
            backgroundColor: isSelected ? options?.mainColor || "#66BB6A" : "transparent",
            color: isSelected ? (options?.selectedTextColor || "#fff") : (options?.textDefaultColor || "#000"),
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div style={styles.calendarContainer}>
      <div style={styles.calendarHeader}>
        <button onClick={() => changeMonth(-1)} style={styles.calendarNavButton}>←</button>
        <span style={{ color: options?.textHeaderColor || "#66BB6A" }}>
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={() => changeMonth(1)} style={styles.calendarNavButton}>→</button>
      </div>
      <div style={styles.calendarWeekdays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} style={styles.calendarWeekday}>{day}</div>
        ))}
      </div>
      <div style={styles.calendarGrid}>
        {renderCalendar()}
      </div>
    </div>
  );
};

const SleepTracker = ({ onUpdateReport = () => {}, navigation }) => {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
  const [selectedDate, setSelectedDate] = useState(today);
  const [isOpen, setIsOpen] = useState(false);

  const [sleepHour, setSleepHour] = useState("10");
  const [sleepMinute, setSleepMinute] = useState("00");
  const [sleepPeriod, setSleepPeriod] = useState("PM");
  const [wakeHour, setWakeHour] = useState("06");
  const [wakeMinute, setWakeMinute] = useState("00");
  const [wakePeriod, setWakePeriod] = useState("AM");

  const [sleepData, setSleepData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSleepData = async () => {
    try {
      // For demo purposes, load from localStorage
      const savedData = localStorage.getItem("sleepData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Sort by date in descending order (latest first)
        const sortedHistory = parsedData.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setSleepData(sortedHistory);
      }
    } catch (error) {
      console.error("Error loading sleep history:", error);
    }
  };

  useEffect(() => {
    loadSleepData().then(() => setLoading(false));
  }, []);

  const calculateDuration = () => {
    const parseTime = (hour, minute, period) => {
      let h = parseInt(hour, 10);
      let m = parseInt(minute, 10);
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    let sleepMinutes = parseTime(sleepHour, sleepMinute, sleepPeriod);
    let wakeMinutes = parseTime(wakeHour, wakeMinute, wakePeriod);
    if (wakeMinutes < sleepMinutes) wakeMinutes += 24 * 60;
    const durationMinutes = wakeMinutes - sleepMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const saveSleepData = async () => {
    try {
      console.log("Starting to save sleep data...");
      
      const formattedDate = selectedDate.replace(/\//g, "-");
      
      const newEntry = {
        id: Date.now(),
        date: formattedDate,
        sleep_time: `${sleepHour}:${sleepMinute} ${sleepPeriod}`,
        wake_time: `${wakeHour}:${wakeMinute} ${wakePeriod}`,
        duration: calculateDuration(),
      };

      console.log("New entry:", newEntry);

      const updatedData = [newEntry, ...sleepData];
      localStorage.setItem("sleepData", JSON.stringify(updatedData));
      
      setSleepData(updatedData);
      if (onUpdateReport) onUpdateReport();
      
      console.log("Sleep data saved successfully");
    } catch (error) {
      console.error("Error saving sleep data:", error);
    }
  };

  const deleteEntry = async (id) => {
    const updatedHistory = sleepData.filter((entry) => entry.id !== id);
    setSleepData(updatedHistory);
    localStorage.setItem("sleepData", JSON.stringify(updatedHistory));
    if (onUpdateReport) onUpdateReport(updatedHistory);
  };

  const handleBack = () => {
    if (navigation && typeof navigation.goBack === "function") {
      navigation.goBack();
      return;
    }

    window.history.back();
  };

  return (
    <div
      style={{
        flex: 1,
        padding: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          ←
        </button>
      </div>

      <h1
        style={{
          fontSize: "24px",
          textAlign: "center",
          marginBottom: "20px",
          fontWeight: "bold",
        }}
      >
        Sleep Tracker
      </h1>

      <p style={{ fontSize: "18px", marginBottom: "10px" }}>
        Selected Date: {selectedDate}
      </p>

      {/* Date Picker */}
      <SimpleDatePicker
        selected={selectedDate}
        onDateChange={(date) => setSelectedDate(date)}
        options={{
          backgroundColor: "#fff",
          textHeaderColor: "#66BB6A",
          textDefaultColor: "#000",
          selectedTextColor: "#fff",
          mainColor: "#66BB6A",
          textSecondaryColor: "#aaa",
        }}
      />

      <p style={styles.text}>Sleep Time:</p>
      <div style={styles.pickerContainer}>
        <select
          value={sleepHour}
          onChange={(e) => setSleepHour(e.target.value)}
          style={styles.select}
        >
          {generateHourOptions().map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <select
          value={sleepMinute}
          onChange={(e) => setSleepMinute(e.target.value)}
          style={styles.select}
        >
          {generateMinuteOptions().map((minute) => (
            <option key={minute} value={minute}>{minute}</option>
          ))}
        </select>
        <select
          value={sleepPeriod}
          onChange={(e) => setSleepPeriod(e.target.value)}
          style={styles.select}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      <p style={styles.text}>Wake Time:</p>
      <div style={styles.pickerContainer}>
        <select
          value={wakeHour}
          onChange={(e) => setWakeHour(e.target.value)}
          style={styles.select}
        >
          {generateHourOptions().map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <select
          value={wakeMinute}
          onChange={(e) => setWakeMinute(e.target.value)}
          style={styles.select}
        >
          {generateMinuteOptions().map((minute) => (
            <option key={minute} value={minute}>{minute}</option>
          ))}
        </select>
        <select
          value={wakePeriod}
          onChange={(e) => setWakePeriod(e.target.value)}
          style={styles.select}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      <p style={styles.text}>Sleep Duration: {calculateDuration()}</p>
      
      <button
        onClick={saveSleepData}
        style={{
          backgroundColor: "#66BB6A",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          fontSize: "16px",
          cursor: "pointer",
          width: "100%",
          marginBottom: "20px",
        }}
      >
        Save Sleep Data
      </button>

      <h2 style={styles.historyTitle}>Sleep History</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={styles.table}>
          <div style={styles.row}>
            <div style={styles.headerCell}>Date</div>
            <div style={styles.headerCell}>Sleep Time</div>
            <div style={styles.headerCell}>Wake Time</div>
            <div style={styles.headerCell}>Duration</div>
            <div style={styles.headerCell}>Actions</div>
          </div>
          {sleepData.length > 0 ? (
            sleepData.map((entry) => (
              <div key={entry.id} style={styles.row}>
                <div style={styles.cell}>{entry.date}</div>
                <div style={styles.cell}>{entry.sleep_time}</div>
                <div style={styles.cell}>{entry.wake_time}</div>
                <div style={styles.cell}>{entry.duration}</div>
                <div style={styles.cell}>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    style={{
                      backgroundColor: "#ff4444",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", padding: "20px" }}>
              No sleep history found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  pickerContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  select: {
    flex: 1,
    padding: "8px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  table: {
    marginTop: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#ccc",
    marginBottom: "20px",
    borderRadius: "5px",
    overflow: "hidden",
  },
  row: {
    display: "flex",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#ccc",
    padding: "10px",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: "14px",
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: "14px",
  },
  text: {
    marginTop: "10px",
    marginBottom: "5px",
    fontSize: "16px",
  },
  historyTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "20px",
    marginBottom: "10px",
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  calendarNavButton: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "5px 10px",
  },
  calendarWeekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    marginBottom: "5px",
  },
  calendarWeekday: {
    fontSize: "12px",
    color: "#aaa",
    padding: "5px",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  },
  calendarCell: {
    border: "none",
    padding: "8px",
    textAlign: "center",
    cursor: "pointer",
    borderRadius: "5px",
    fontSize: "14px",
  },
  calendarEmptyCell: {
    padding: "8px",
  },
};

export default SleepTracker;