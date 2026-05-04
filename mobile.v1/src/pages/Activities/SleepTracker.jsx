import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Plus, ChevronLeft, ChevronRight, Clock, Trash2, ArrowLeft } from "lucide-react";
import axiosInstance from "../../utils/axios.instance";
import ModalPortal from "../../components/ModalPortal";
import TokenRewardModal from "../../components/TokenRewardModal";
import ReusableModal from "../../components/ReusableModal";

import "./SleepTracker.css";

const SleepTracker = () => {
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [sleepTime, setSleepTime] = useState({ hour: "10", minute: "30", period: "PM" });
  const [wakeTime, setWakeTime] = useState({ hour: "06", minute: "45", period: "AM" });
  
  const [showPicker, setShowPicker] = useState(null); // 'sleep' or 'wake'
  const [sleepData, setSleepData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (userId) {
      loadSleepData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const weeklyInsight = useMemo(() => {
    if (sleepData.length === 0) return "Start logging your sleep to see your weekly performance trends here.";
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeekLogs = sleepData.filter(log => new Date(log.date) >= oneWeekAgo);
    
    if (thisWeekLogs.length === 0) return "You haven't logged any sleep this week. Regular tracking helps identify healthy patterns.";
    
    const avgMinutes = thisWeekLogs.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0) / thisWeekLogs.length;
    const hours = Math.floor(avgMinutes / 60);
    
    if (avgMinutes >= 420) {
      return `Amazing! You're averaging ${hours}h of sleep this week. Your REM recovery is likely in the optimal zone.`;
    } else {
      return `You're averaging ${hours}h of sleep. Try to hit the 7-hour mark to boost your cognitive focus tomorrow.`;
    }
  }, [sleepData]);

  const loadSleepData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get("/activities");
      const activities = response.data.activities || [];

      const history = activities
        .filter(act => act.activity_type === "sleep")
        .map(act => {
          const data = act.data;
          let totalMinutes = data.totalMinutes;
          
          // Parse old duration string if totalMinutes is missing
          if (!totalMinutes && data.duration) {
            const match = data.duration.match(/(\d+)h\s*(\d*)m/);
            if (match) {
              totalMinutes = parseInt(match[1], 10) * 60 + (parseInt(match[2], 10) || 0);
            }
          }
          
          return {
            id: act.id,
            ...data,
            totalMinutes
          };
        })
        .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));

      setSleepData(history);
    } catch (error) {
      console.error("Error loading sleep history:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    const parseTime = (time) => {
      let h = parseInt(time.hour, 10);
      let m = parseInt(time.minute, 10);
      if (time.period === "PM" && h !== 12) h += 12;
      if (time.period === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    
    let sleepMinutes = parseTime(sleepTime);
    let wakeMinutes = parseTime(wakeTime);
    if (wakeMinutes < sleepMinutes) wakeMinutes += 24 * 60;
    
    const durationMinutes = wakeMinutes - sleepMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return { hours, minutes, totalMinutes: durationMinutes };
  };

  const { hours, minutes } = calculateDuration();

  const getStatusBadge = (totalMinutes) => {
    if (totalMinutes >= 420 && totalMinutes <= 540) return "OPTIMAL";
    if (totalMinutes < 420) return "LOW";
    return "EXCESSIVE";
  };

  const saveSleepData = async () => {
    if (!userId || isSaving) return;
    try {
      setIsSaving(true);
      const duration = calculateDuration();
      const newEntry = {
        date: selectedDate.toISOString().split('T')[0],
        sleep_time: `${sleepTime.hour}:${sleepTime.minute} ${sleepTime.period}`,
        wake_time: `${wakeTime.hour}:${wakeTime.minute} ${wakeTime.period}`,
        duration: `${duration.hours}h ${duration.minutes}m`,
        totalMinutes: duration.totalMinutes,
        timestamp: new Date().toISOString(),
      };

      const res = await axiosInstance.post("/activities/save", {
        activityType: "sleep",
        data: newEntry
      });

      if (res.data?.updatedTokens !== null) {
        dispatch(updateTokens(res.data.updatedTokens));
        setShowRewardModal(true);
      }

      loadSleepData();
    } catch (error) {
      console.error("Error saving sleep data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id) => {
    setSleepData(sleepData.filter(e => e.id !== id));
    setConfirmDeleteId(null);
  };

  // ── CALENDAR LOGIC ──
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days = [];
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    
    // Fill previous month days (grayed out usually, but here we just leave empty for clean look)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ 
        day: i, 
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i) 
      });
    }
    return days;
  }, [currentMonth, daysInMonth, firstDayOfMonth]);

  const isSelected = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isFuture = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  if (!user) {
    return (
      <div className="sleep-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div className="log-session-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
           <Moon size={48} color="#7c3aed" style={{ marginBottom: '20px' }} />
           <h2>Login Required</h2>
           <p style={{ color: '#6b7280', margin: '15px 0 25px' }}>Please log in to track your nocturnal recovery and wake up restored.</p>
           <button className="save-btn" onClick={() => navigate("/")}>Go to Login</button>
         </div>
      </div>
    );
  }

  return (
    <div className="sleep-container">
      <div className="sleep-content">
        
        <header className="sleep-header">
          <button className="nav-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>Sleep Tracker</motion.h1>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            Monitor your nocturnal recovery and wake up restored.
          </motion.p>
        </header>

        <div className="sleep-grid">
          
          {/* ── LEFT: LOG SESSION ── */}
          <motion.div 
            className="log-session-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-title">
              <div className="add-icon"><Plus size={16} strokeWidth={3} /></div>
              Log New Session
            </div>

            <div className="calendar-section">
              <label>Select Date</label>
              <div className="calendar-nav">
                <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
                  <ChevronLeft size={20} />
                </button>
                <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                {["M", "T", "W", "T", "F", "S", "S"].map(d => (
                  <div key={d} className="weekday-label">{d}</div>
                ))}
                {calendarDays.map((d, i) => (
                  d.day ? (
                    <button 
                      key={i} 
                      className={`calendar-day ${isSelected(d.date) ? 'selected' : ''} ${isToday(d.date) ? 'today' : ''} ${isFuture(d.date) ? 'future' : ''}`}
                      onClick={() => !isFuture(d.date) && setSelectedDate(d.date)}
                      disabled={isFuture(d.date)}
                    >
                      {d.day}
                    </button>
                  ) : <div key={i} />
                ))}
              </div>
            </div>

            <div className="time-inputs">
              <div className="input-group">
                <label>Sleep Time</label>
                <div className="time-box" onClick={() => setShowPicker('sleep')}>
                  <Moon size={18} color="#9ca3af" />
                  <div className="time-value">{sleepTime.hour}:{sleepTime.minute} {sleepTime.period}</div>
                  <Clock size={16} color="#9ca3af" />
                </div>
              </div>
              <div className="input-group">
                <label>Wake Time</label>
                <div className="time-box" onClick={() => setShowPicker('wake')}>
                  <Sun size={18} color="#9ca3af" />
                  <div className="time-value">{wakeTime.hour}:{wakeTime.minute} {wakeTime.period}</div>
                  <Clock size={16} color="#9ca3af" />
                </div>
              </div>
            </div>

            <div className="duration-card">
              <div className="duration-icon"><Clock size={24} /></div>
              <div className="duration-info">
                <div className="duration-label">Sleep Duration</div>
                <div className="duration-value">{hours}h {minutes}m</div>
              </div>
              <div className="status-badge">{getStatusBadge(hours * 60 + minutes)}</div>
            </div>

            <button 
              className="save-btn" 
              onClick={saveSleepData}
              disabled={isSaving}
              style={isSaving ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              {isSaving ? "Saving..." : "Save Sleep Data"}
            </button>
          </motion.div>

          {/* ── RIGHT: HISTORY & INSIGHTS ── */}
          <div className="history-section">
            <h2>
              Sleep History
              <span className="view-all">View All</span>
            </h2>

            <div className="history-list">
              {sleepData.length > 0 ? sleepData.slice(0, 3).map((log, i) => (
                <motion.div 
                  key={log.id || i} 
                  className="history-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                >
                  <div className="mood-icon">😴</div>
                  <div className="log-details">
                    <div className="log-date">{new Date(log.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="log-duration">{log.duration} Duration</div>
                  </div>
                  <div className="log-time-range" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className="time-range">{log.sleep_time} — {log.wake_time}</span>
                    <span className={`sleep-quality ${log.totalMinutes > 420 ? 'quality-deep' : 'quality-restless'}`}>
                      {log.totalMinutes > 420 ? 'DEEP SLEEP' : 'RESTLESS'}
                    </span>
                    <button 
                      onClick={() => setConfirmDeleteId(log.id)} 
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', marginTop: 'auto' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="history-item" style={{ justifyContent: 'center', color: '#9ca3af' }}>No logs yet</div>
              )}
            </div>

            <motion.div 
              className="insight-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="insight-label">WEEKLY INSIGHT</div>
              <div className="insight-text">
                {weeklyInsight}
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Time Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <ModalPortal>
            <motion.div 
              className="time-picker-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(null)}
            >
              <motion.div 
                className="time-picker-modal"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="picker-header">
                  <div className="picker-title">Set {showPicker === 'sleep' ? 'Sleep' : 'Wake'} Time</div>
                  <button className="picker-close" onClick={() => setShowPicker(null)}>×</button>
                </div>

                <div className="picker-controls">
                  <select 
                    className="picker-select" 
                    value={showPicker === 'sleep' ? sleepTime.hour : wakeTime.hour}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (showPicker === 'sleep') setSleepTime({...sleepTime, hour: val});
                      else setWakeTime({...wakeTime, hour: val});
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select 
                    className="picker-select"
                    value={showPicker === 'sleep' ? sleepTime.minute : wakeTime.minute}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (showPicker === 'sleep') setSleepTime({...sleepTime, minute: val});
                      else setWakeTime({...wakeTime, minute: val});
                    }}
                  >
                    {["00", "15", "30", "45"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    className="picker-select"
                    value={showPicker === 'sleep' ? sleepTime.period : wakeTime.period}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (showPicker === 'sleep') setSleepTime({...sleepTime, period: val});
                      else setWakeTime({...wakeTime, period: val});
                    }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                <button className="picker-confirm" onClick={() => setShowPicker(null)}>Confirm Time</button>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ReusableModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Record"
        type="error"
      >
        <p className="text-slate-500 text-[16px] leading-relaxed font-medium mb-10">
          Are you sure you want to delete this sleep record?
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setConfirmDeleteId(null)}
            className="flex-1 py-4 rounded-[1rem] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => confirmDelete(confirmDeleteId)}
            className="flex-1 py-4 rounded-[1rem] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </ReusableModal>

      <TokenRewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)}
        amount={5}
        message="Good rest is the foundation of mental clarity. Your sleep habits are now logged and your tokens are earned!"
      />
    </div>
  );
};

export default SleepTracker;