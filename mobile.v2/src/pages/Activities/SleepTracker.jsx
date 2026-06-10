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
import { useLanguage } from "../../context/LanguageContext";

import "./SleepTracker.css";

// ── NSF Age-Based Sleep Range Helpers (Hirshkowitz et al., 2015) ──
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value) => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(value);
};

const getAgeFromBirthday = (birthday) => {
  if (!birthday) return null;
  const birthDate = parseLocalDate(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const getSleepRangeForAge = (age) => {
  if (age === null) return { min: 420, max: 540 };    // fallback: adult default
  if (age >= 14 && age <= 17) return { min: 480, max: 600 }; // Teenagers 8–10h
  if (age >= 65)              return { min: 420, max: 480 }; // Older Adults 7–8h
  return { min: 420, max: 540 };                             // 18–64 yrs 7–9h
};

const hasPersistentInsufficientSleep = (logs, minimumMinutes, requiredDays = 15) => {
  const logsByDate = new Map();
  logs.forEach((log) => {
    if (log.date) logsByDate.set(formatLocalDate(parseLocalDate(log.date)), log);
  });

  const sortedDates = [...logsByDate.keys()]
    .map(parseLocalDate)
    .sort((a, b) => b - a);

  let consecutiveDays = 0;
  for (let index = 0; index < sortedDates.length; index += 1) {
    const date = sortedDates[index];
    const log = logsByDate.get(formatLocalDate(date));
    if (!log || (log.totalMinutes || 0) >= minimumMinutes) break;

    if (index > 0) {
      const previousDate = sortedDates[index - 1];
      const dayDifference = Math.round((previousDate - date) / 86400000);
      if (dayDifference !== 1) break;
    }

    consecutiveDays += 1;
    if (consecutiveDays >= requiredDays) return true;
  }

  return false;
};

const SleepTracker = () => {
  const { t, language } = useLanguage();
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const MotionDiv = motion.div;

  // Derived age-based sleep range for this user
  const sleepRange = useMemo(() => {
    const age = getAgeFromBirthday(user?.birthday);
    return getSleepRangeForAge(age);
  }, [user?.birthday]);

  const userAge = useMemo(
    () => getAgeFromBirthday(user?.birthday),
    [user?.birthday]
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [sleepTime, setSleepTime] = useState({ hour: "10", minute: "30", period: "PM" });
  const [wakeTime, setWakeTime] = useState({ hour: "06", minute: "45", period: "AM" });
  
  const [showPicker, setShowPicker] = useState(null); // 'sleep' or 'wake'
  const [sleepData, setSleepData] = useState([]);
  const [, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSleepData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const weeklyInsight = useMemo(() => {
    if (sleepData.length === 0) return t('sleep_no_logs');

    const { min, max } = sleepRange;
    const minHours = Math.floor(min / 60);
    const maxHours = Math.floor(max / 60);

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const thisWeekLogs = sleepData.filter(log => parseLocalDate(log.date) >= oneWeekAgo);
    const prevWeekLogs = sleepData.filter(log => {
      const d = parseLocalDate(log.date);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    if (thisWeekLogs.length === 0) return t('sleep_no_logs_week');

    const avgMinutes = thisWeekLogs.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0) / thisWeekLogs.length;

    // Clinical referral: more than two consecutive weeks below the minimum.
    if (hasPersistentInsufficientSleep(sleepData, min)) {
      return t('sleep_insight_clinical');
    }

    // ✅ OPTIMAL — within recommended range
    if (avgMinutes >= min && avgMinutes <= max) {
      return t('sleep_insight_optimal');
    }

    // 📈 IMPROVING — rising from previous week but still below minimum
    if (avgMinutes < min && prevWeekLogs.length > 0) {
      const prevAvg = prevWeekLogs.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0) / prevWeekLogs.length;
      if (avgMinutes > prevAvg) {
        return t('sleep_insight_improving').replace('{min}', minHours).replace('{max}', maxHours);
      }
    }

    // ⚠️ LOW — below minimum
    if (avgMinutes < min) {
      return t('sleep_insight_low').replace('{min}', minHours).replace('{max}', maxHours);
    }

    // 🚨 EXCESSIVE — above maximum
    return t('sleep_insight_excessive').replace('{max}', maxHours);
  }, [sleepData, t, sleepRange]);

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
        .sort((a, b) => parseLocalDate(b.date || b.timestamp) - parseLocalDate(a.date || a.timestamp));

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
    const { min, max } = sleepRange;
    if (totalMinutes >= min && totalMinutes <= max) return t('sleep_optimal');
    if (totalMinutes < min) return t('sleep_low');
    return t('sleep_excessive');
  };

  const saveSleepData = async () => {
    if (!userId || isSaving) return;
    try {
      setIsSaving(true);
      const duration = calculateDuration();
      const newEntry = {
        date: formatLocalDate(selectedDate),
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

      if (res.data && typeof res.data.updatedTokens === 'number') {
        dispatch(updateTokens(res.data.updatedTokens));
      }
      setShowRewardModal(true);

      loadSleepData();
    } catch (error) {
      console.error("Error saving sleep data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await axiosInstance.delete(`/activities/${id}`);
      setSleepData(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting sleep record:", error);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // ── CALENDAR LOGIC ──
  const renderSleepHistoryItem = (log, i, isModal = false) => (
    <MotionDiv 
      key={log.id || i} 
      className={`history-item ${isModal ? "history-modal-item" : ""}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: isModal ? i * 0.03 : 0.3 + (i * 0.1) }}
    >
      <div className="mood-icon">😴</div>
      <div className="log-details">
        <div className="log-date">{parseLocalDate(log.date).toLocaleDateString(language === 'tl' ? 'tl-PH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div className="log-duration">{log.duration} {language === 'tl' ? 'Tagal' : 'Duration'}</div>
      </div>
      <div className="log-time-range">
        <span className="time-range">{log.sleep_time} — {log.wake_time}</span>
        <span className={`sleep-quality ${(log.totalMinutes || 0) >= sleepRange.min ? 'quality-deep' : 'quality-restless'}`}>
          {(log.totalMinutes || 0) >= sleepRange.min ? t('sleep_quality_deep') : t('sleep_quality_restless')}
        </span>
        <button 
          onClick={() => setConfirmDeleteId(log.id)} 
          className="delete-history-btn"
          aria-label={language === 'tl' ? "I-delete ang sleep record" : "Delete sleep record"}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </MotionDiv>
  );

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days = [];
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
           <h2>{t('privacy_consent')}</h2>
           <p style={{ color: '#6b7280', margin: '15px 0 25px' }}>{t('safety_reminder_desc')}</p>
           <button className="save-btn" onClick={() => navigate("/")}>{t('back')}</button>
         </div>
      </div>
    );
  }

  return (
    <div className="sleep-container">
      <div className="sleep-content">
        
        <header className="sleep-header">
          <button className="nav-btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
            <ArrowLeft size={20} /> {t('back')}
          </button>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>{t('sleep_title')}</motion.h1>
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            {t('sleep_subtitle')}
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
              {t('sleep_log_new')}
            </div>

            <div className="calendar-section">
              <label>{t('sleep_select_date')}</label>
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
                <label>{t('sleep_time_label')}</label>
                <div className="time-box" onClick={() => setShowPicker('sleep')}>
                  <Moon size={18} color="#9ca3af" />
                  <div className="time-value">{sleepTime.hour}:{sleepTime.minute} {sleepTime.period}</div>
                  <Clock size={16} color="#9ca3af" />
                </div>
              </div>
              <div className="input-group">
                <label>{t('wake_time_label')}</label>
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
                <div className="duration-label">{t('sleep_duration_label')}</div>
                <div className="duration-value">{hours}{language === 'tl' ? 'o' : 'h'} {minutes}{language === 'tl' ? 'm' : 'm'}</div>
              </div>
              <div className="status-badge">{getStatusBadge(hours * 60 + minutes)}</div>
            </div>

            <button 
              className="save-btn" 
              onClick={saveSleepData}
              disabled={isSaving}
              style={isSaving ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            >
              {isSaving ? (language === 'tl' ? "Inililigtas..." : "Saving...") : t('sleep_save_btn')}
            </button>
          </motion.div>

          {/* ── RIGHT: HISTORY & INSIGHTS ── */}
          <div className="history-section">
            <h2>
              {t('sleep_history_title')}
              <button
                type="button"
                className="view-all"
                onClick={() => setShowHistoryModal(true)}
              >
                {language === 'tl' ? "Tingnan Lahat" : "View All"}
              </button>
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
                    <div className="log-date">{parseLocalDate(log.date).toLocaleDateString(language === 'tl' ? 'tl-PH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="log-duration">{log.duration} {language === 'tl' ? 'Tagal' : 'Duration'}</div>
                  </div>
                  <div className="log-time-range" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className="time-range">{log.sleep_time} — {log.wake_time}</span>
                    <span className={`sleep-quality ${(log.totalMinutes || 0) >= sleepRange.min ? 'quality-deep' : 'quality-restless'}`}>
                      {(log.totalMinutes || 0) >= sleepRange.min ? t('sleep_quality_deep') : t('sleep_quality_restless')}
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
                <div className="history-item" style={{ justifyContent: 'center', color: '#9ca3af' }}>{t('sleep_no_logs')}</div>
              )}
            </div>

            <motion.div 
              className="insight-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {userAge !== null && (
                <div className="insight-age">
                  {language === 'tl' ? 'Edad' : 'Age'}: {userAge}
                </div>
              )}
              <div className="insight-text">
                {weeklyInsight}
              </div>
              <div className="insight-source">
                {language === 'tl'
                  ? 'Batayan: Hirshkowitz et al. (2015); ang persistent sleep concerns ay sumusunod sa WHO mhGAP at DOH Philippines referral guidance.'
                  : 'Basis: Hirshkowitz et al. (2015); persistent sleep concerns follow WHO mhGAP and DOH Philippines referral guidance.'}
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
                  <div className="picker-title">{language === 'tl' ? 'I-set ang Oras ng' : 'Set'} {showPicker === 'sleep' ? (language === 'tl' ? 'Pagtulog' : 'Sleep') : (language === 'tl' ? 'Paggising' : 'Wake')}</div>
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

      <AnimatePresence>
        {showHistoryModal && (
          <ModalPortal>
            <MotionDiv
              className="sleep-history-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
            >
              <MotionDiv
                className="sleep-history-modal"
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sleep-history-modal-header">
                  <div>
                    <h2>{t('sleep_history_title')}</h2>
                    <p>{sleepData.length} {language === 'tl' ? 'sleep record' : `saved sleep record${sleepData.length === 1 ? "" : "s"}`}</p>
                  </div>
                  <button className="history-modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
                </div>

                <div className="sleep-history-modal-list">
                  {sleepData.length > 0 ? sleepData.map((log, i) => renderSleepHistoryItem(log, i, true)) : (
                    <div className="history-item" style={{ justifyContent: 'center', color: '#9ca3af' }}>{t('sleep_no_logs')}</div>
                  )}
                </div>
              </MotionDiv>
            </MotionDiv>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ReusableModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title={language === 'tl' ? "I-delete ang Record" : "Delete Record"}
        type="error"
      >
        <p className="text-slate-500 text-[16px] leading-relaxed font-medium mb-10">
          {language === 'tl' ? "Sigurado ka bang gusto mong i-delete ang sleep record na ito?" : "Are you sure you want to delete this sleep record?"}
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setConfirmDeleteId(null)}
            className="flex-1 py-4 rounded-[1rem] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {language === 'tl' ? "Kanselahin" : "Cancel"}
          </button>
          <button 
            onClick={() => confirmDelete(confirmDeleteId)}
            className="flex-1 py-4 rounded-[1rem] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
          >
            {language === 'tl' ? "I-delete" : "Delete"}
          </button>
        </div>
      </ReusableModal>

      <TokenRewardModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)}
        amount={5}
        message={t('sleep_reward')}
      />
    </div>
  );
};

export default SleepTracker;
