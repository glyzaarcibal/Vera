import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Frown, Meh, Sun, X, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import axiosInstance from "../utils/axios.instance";
import { useDispatch } from "react-redux";
import { updateTokens } from "../store/slices/authSlice";
import { useLanguage } from "../context/LanguageContext";
import { MOOD_LEVELS } from "../utils/moodData";
import "./MoodTrackerModal.css";

import ModalPortal from "./ModalPortal";

const MoodTrackerModal = ({ isOpen, onClose, onLogged }) => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsSubmitting(true);
    try {
      const moodData = {
        mood: selectedMood.mood,
        moodEmoji: selectedMood.emoji,
        moodColor: selectedMood.color,
        reason: reason,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      const res = await axiosInstance.post("/activities/save", {
        activityType: "mood",
        data: moodData
      });

      if (res.data?.updatedTokens) {
        dispatch(updateTokens(res.data.updatedTokens));
      }

      setIsSuccess(true);
      setTimeout(() => {
        onLogged();
        onClose();
        setSelectedCategory(null);
        setSelectedMood(null);
        setReason("");
        setIsSuccess(false);
      }, 2000);
    } catch (e) {
      console.error("Error saving mood:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredMoods = selectedCategory 
    ? MOOD_LEVELS.filter(m => m.category === selectedCategory)
    : [];

  return (
    <ModalPortal>
      <div className="mood-modal-overlay">
        <motion.div 
          className="mood-modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          {!isSuccess ? (
            <>
              <div className="mood-modal-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  {(selectedCategory || selectedMood) && (
                    <button className="back-btn" onClick={() => {
                      if (selectedMood) setSelectedMood(null);
                      else setSelectedCategory(null);
                    }}>
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <h3>{t("mood_checkin_title")}</h3>
                </div>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
              </div>
              
              <p className="mood-modal-desc">
                {!selectedCategory ? t("mood_checkin_desc") : 
                 !selectedMood ? `Pick a ${selectedCategory.toLowerCase()} emotion:` : 
                 "Tell us more about it:"}
              </p>
              
              <AnimatePresence mode="wait">
                {!selectedCategory ? (
                  <motion.div 
                    key="categories"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="category-selection"
                  >
                    <button className="cat-option positive" onClick={() => setSelectedCategory('Positive')}>
                      <Sun size={40} color="#FBBF24" />
                      <span>Positive Moods</span>
                    </button>
                    <button className="cat-option negative" onClick={() => setSelectedCategory('Negative')}>
                      <Frown size={40} color="#EF4444" />
                      <span>Negative Moods</span>
                    </button>
                  </motion.div>
                ) : !selectedMood ? (
                  <motion.div 
                    key="moods"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mood-grid-scroll"
                  >
                    {filteredMoods.map((m) => (
                      <button 
                        key={m.mood} 
                        className="mood-item-mini"
                        onClick={() => setSelectedMood(m)}
                        style={{ borderLeft: `4px solid ${m.color}`, background: `${m.bgColor}40` }}
                      >
                        <span className="mood-emoji">{m.emoji}</span>
                        <span className="mood-text">{m.mood}</span>
                        <ChevronRight size={14} className="chevron" />
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="reason"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mood-reason-area"
                  >
                    <div className="selected-preview" style={{ background: selectedMood.bgColor, borderColor: selectedMood.color }}>
                      <span className="preview-emoji">{selectedMood.emoji}</span>
                      <span className="preview-label" style={{ color: selectedMood.color }}>{selectedMood.mood}</span>
                    </div>
                    <textarea 
                      placeholder="What's making you feel this way? (Optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      autoFocus
                    />
                    <button 
                      className="submit-mood-btn" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "..." : t("log_mood")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="mood-success-state">
              <CheckCircle size={64} color="#10B981" />
              <h3>Mood Logged!</h3>
              <p>Thank you for checking in. You've earned 5 tokens! 🪙</p>
            </div>
          )}
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default MoodTrackerModal;
