import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateTokens } from "../../store/slices/authSlice";
import { selectUser } from "../../store/slices/authSelectors";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Smile, Palette, Trash2, ArrowLeft, Book, Heart, Trees } from "lucide-react";
import axiosInstance from "../../utils/axios.instance";
import ModalPortal from "../../components/ModalPortal";
import TokenRewardModal from "../../components/TokenRewardModal";
import ReusableModal from "../../components/ReusableModal";
import { useLanguage } from "../../context/LanguageContext";
import jarImage from "../../assets/jar.png";

import "./Diary.css";

const Diary = () => {
  const { t, language } = useLanguage();
  const user = useSelector(selectUser);
  const userId = user?.id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Selection States
  const [selectedMood, setSelectedMood] = useState("Calm");
  const [selectedColor, setSelectedColor] = useState("#7C3AED");
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const moods = [
    { label: "Calm", icon: "😌", tKey: "calm" },
    { label: "Happy", icon: "😊", tKey: "happy" },
    { label: "Sad", icon: "😔", tKey: "sad" },
    { label: "Energetic", icon: "⚡", tKey: "energetic" },
    { label: "Peaceful", icon: "🕊️", tKey: "peaceful" }
  ];

  const colors = [
    { label: language === 'tl' ? "Lila" : "Purple", value: "#7C3AED" },
    { label: language === 'tl' ? "Pula" : "Red", value: "#EF4444" },
    { label: language === 'tl' ? "Berde" : "Green", value: "#10B981" },
    { label: language === 'tl' ? "Bugaw" : "Orange", value: "#F59E0B" },
    { label: language === 'tl' ? "Asul" : "Blue", value: "#3B82F6" }
  ];

  useEffect(() => {
    if (userId) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadEntries = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get("/activities");
      const activities = response.data.activities || [];
      
      const diaryEntries = activities
        .filter(act => act.activity_type === "diary")
        .map(act => ({
          id: act.id,
          ...act.data
        }))
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

      setEntries(diaryEntries);
    } catch (error) {
      console.error("Failed to load entries", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEntryToDB = async (newEntry) => {
    if (!userId) return;
    try {
      const res = await axiosInstance.post("/activities/save", {
        activityType: "diary",
        data: newEntry
      });
      if (res.data && typeof res.data.updatedTokens === 'number') {
        dispatch(updateTokens(res.data.updatedTokens));
        setShowRewardModal(true);
      }
      
      loadEntries();
    } catch (error) {
      console.error("Failed to save entry", error);
    }
  };

  const handleSave = () => {
    if (entry.trim() !== "" && userId) {
      const newEntry = {
        text: entry,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        type: getRandomEntryType(),
        timestamp: new Date().toISOString(),
        mood: selectedMood,
        color: selectedColor,
        category: activeCategory || (language === 'tl' ? "Kapayapaan sa Loob" : "Inner Peace")
      };
      
      saveEntryToDB(newEntry);
      setEntry("");
    }
  };

  const getRandomEntryType = () => {
    const types = ["heart", "leaf", "star", "orb"];
    return types[Math.floor(Math.random() * types.length)];
  };

  const handleEntryPress = (entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const getOrbColor = (item) => {
    // Use the color from the entry data if it exists, otherwise fallback to type-based color
    if (item.color) return hexToRgba(item.color, 0.4);

    switch(item.type) {
      case 'heart': return 'rgba(239, 68, 68, 0.4)';
      case 'leaf': return 'rgba(16, 185, 129, 0.4)';
      case 'star': return 'rgba(245, 158, 11, 0.4)';
      default: return 'rgba(124, 58, 237, 0.4)';
    }
  };

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const confirmDelete = (id) => {
    setEntries(entries.filter(e => e.id !== id));
    setConfirmDeleteId(null);
    setModalVisible(false);
  };

  if (!user) {
    return (
      <div className="diary-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="diary-input-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <span style={{ fontSize: "60px", display: "block", marginBottom: "20px" }}>🔒</span>
          <h2 style={{ color: "#7c3aed", marginBottom: "15px" }}>{t('privacy_consent')}</h2>
          <p style={{ color: "#6b7280", marginBottom: "25px" }}>{t('safety_reminder_desc')}</p>
          <button className="drop-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate("/")}>
             {t('back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diary-container">
      <div className="diary-content">
        
        {/* ── LEFT PANEL ── */}
        <div className="diary-left-panel">
          <button className="option-btn" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>
            <ArrowLeft size={18} /> {t('back')}
          </button>

          <header className="diary-header">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }}
            >
              {t('diary_title').split('{mind}')[0]}<span className="accent-text">{language === 'tl' ? 'isip' : 'mind'}</span>{t('diary_title').split('{mind}')[1]}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t('diary_subtitle')}
            </motion.p>
          </header>

          <motion.div 
            className="diary-input-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <textarea
              className="diary-textarea"
              placeholder={t('diary_placeholder')}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
            
            <div className="diary-controls">
              <div className="diary-options">
                <div style={{ position: 'relative' }}>
                  <button 
                    className="option-btn" 
                    onClick={() => { setShowMoodPicker(!showMoodPicker); setShowColorPicker(false); }}
                    style={{ backgroundColor: showMoodPicker ? '#e5e7eb' : '' }}
                  >
                    {moods.find(m => m.label === selectedMood)?.icon} {t(moods.find(m => m.label === selectedMood)?.tKey || 'calm')}
                  </button>
                  {showMoodPicker && (
                    <div className="picker-popover">
                      {moods.map(m => (
                        <button key={m.label} onClick={() => { setSelectedMood(m.label); setShowMoodPicker(false); }}>
                          {m.icon} {t(m.tKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button 
                    className="option-btn" 
                    onClick={() => { setShowColorPicker(!showColorPicker); setShowMoodPicker(false); }}
                    style={{ backgroundColor: showColorPicker ? '#e5e7eb' : '' }}
                  >
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedColor }} /> Color
                  </button>
                  {showColorPicker && (
                    <div className="picker-popover">
                      {colors.map(c => (
                        <button key={c.label} onClick={() => { setSelectedColor(c.value); setShowColorPicker(false); }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.value }} /> {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="drop-btn" 
                onClick={handleSave}
                disabled={!entry.trim()}
              >
                {t('diary_drop_btn')} <Sparkles size={18} />
              </button>
            </div>
          </motion.div>

          <div className="diary-categories">
            {[
              { name: t('diary_nature_walk'), icon: <Trees size={20} />, color: "#ecfdf5", iconColor: "#10b981" },
              { name: t('diary_dream_journal'), icon: <motion.span animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>🌙</motion.span>, color: "#f5f3ff", iconColor: "#7c3aed" },
              { name: t('diary_gratitude'), icon: <Heart size={20} fill="#ef4444" color="#ef4444" />, color: "#fef2f2", iconColor: "#ef4444" }
            ].map((cat, i) => {
              const count = entries.filter(e => e.category === cat.name).length;
              const isActive = activeCategory === cat.name;
              return (
                <motion.div 
                  key={i} 
                  className="category-card"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActiveCategory(isActive ? null : cat.name)}
                  style={{ 
                    border: isActive ? `2px solid ${cat.iconColor}` : '1px solid rgba(0,0,0,0.03)',
                    backgroundColor: isActive ? '#fff' : ''
                  }}
                >
                  <div className="cat-icon-box" style={{ backgroundColor: cat.color, color: cat.iconColor }}>
                    {cat.icon}
                  </div>
                  <div className="cat-info">
                    <h4>{cat.name}</h4>
                    <span>{count} {t('diary_reflections')}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="diary-right-panel">
          <div className="jar-visual-container">
            <img src={jarImage} alt="Serenity Jar" className="jar-image-main" />
            
            <div className="orbs-container">
              {(activeCategory ? entries.filter(e => e.category === activeCategory) : entries).map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  className="orb"
                  style={{ 
                    backgroundColor: getOrbColor(item),
                    left: `${20 + Math.random() * 60}%`,
                    top: `${30 + Math.random() * 50}%`
                  }}
                  animate={{ 
                    y: [0, -15, 0],
                    x: [0, Math.random() * 20 - 10, 0]
                  }}
                  transition={{ 
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  onClick={() => handleEntryPress(item)}
                />
              ))}
            </div>

            <div className="jar-label">
              <span>{language === 'tl' ? 'KASALUKUYANG JAR' : 'CURRENT JAR'}</span>
              <h3>{activeCategory || (language === 'tl' ? "Kapayapaan sa Loob" : "Inner Peace")}</h3>
            </div>
          </div>

          <div className="diary-stats">
            <div className="stat-item">
              <span className="stat-value">{entries.length || "0"}</span>
              <span className="stat-label-text">{language === 'tl' ? 'KABUUANG ORBS' : 'TOTAL ORBS'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Entry Modal */}
      <AnimatePresence>
        {modalVisible && selectedEntry && (
          <ModalPortal>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalVisible(false)}
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
                display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000
              }}
            >
              <motion.div
                className="diary-input-card"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "500px", width: "90%", background: 'white' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div className="cat-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <Book size={24} />
                  </div>
                  <button className="option-btn" onClick={() => setModalVisible(false)}>✕</button>
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>{t('diary_memory_from')} {selectedEntry.date}</h2>
                <p style={{ fontSize: '1.1rem', color: '#4b5563', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{selectedEntry.text}"
                </p>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                   <button className="drop-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalVisible(false)}>{t('diary_keep_in_jar')}</button>
                   <button className="option-btn" onClick={() => setConfirmDeleteId(selectedEntry.id)} style={{ color: '#ef4444' }}>
                     <Trash2 size={18} />
                   </button>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      <ReusableModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title={language === 'tl' ? "I-delete ang Alaala" : "Delete Memory"}
        type="error"
      >
        <p className="text-slate-500 text-[16px] leading-relaxed font-medium mb-10">
          {t('diary_delete_confirm')}
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
        message={t('diary_reward')}
      />
    </div>
  );
};

export default Diary;

