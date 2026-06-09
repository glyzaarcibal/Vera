import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors.js";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Mic,
  Book,
  Heart,
  Sparkles,
  Zap,
  ArrowRight,
  Smile,
  Frown,
  Meh,
  Sun
} from "lucide-react";
import axiosInstance from "../utils/axios.instance.js";
import PullToRefresh from "../components/PullToRefresh.jsx";
import MoodTrackerModal from "../components/MoodTrackerModal.jsx";
import { useLanguage } from "../context/LanguageContext";
import "./UserDashboard.css";

const UserDashboard = () => {
  const { language = 'en', t } = useLanguage();
  console.log("[UserDashboard] Current language:", language);
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good morning");
  const [vitality, setVitality] = useState(0);
  const [syncDepth, setSyncDepth] = useState(88);
  const [veraQuote, setVeraQuote] = useState("");
  const [resources, setResources] = useState([]);
  const [assignedResources, setAssignedResources] = useState([]);
  const [showMoodModal, setShowMoodModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await axiosInstance.get("/activities");
      const logs = res.data.activities || [];

      const today = new Date().toLocaleDateString('en-US');
      const moodToday = logs.find(l => l.activity_type === 'mood' && l.data?.date === today);
      if (!moodToday) {
        setShowMoodModal(true);
      }

      const newVitality = Math.min(20 + (logs.length * 5), 100);
      setVitality(newVitality);
      setSyncDepth(Math.min(100, 65 + (logs.length * 4)));

      if (newVitality >= 80) setVeraQuote(t("vera_quote_high"));
      else if (newVitality >= 50) setVeraQuote(t("vera_quote_med"));
      else setVeraQuote(t("vera_quote_low"));

      const resResources = await axiosInstance.get("/resources");
      const allResources = resResources.data.resources || resResources.data || [];
      
      let assignedDetails = [];
      try {
        if (user?.id) {
          const assignedRes = await axiosInstance.get(`/resources/get-assignments/${user.id}`);
          const assignments = assignedRes.data.assignments || [];
          assignedDetails = assignments
            .map(a => allResources.find(x => String(x.id) === String(a.resource_id)))
            .filter(Boolean);
          setAssignedResources(assignedDetails);
        }
      } catch (err) {
        console.error("Error fetching assigned resources:", err);
      }

      // Exclude assigned resources from generic recommended list
      setResources(allResources.filter(r => !assignedDetails.some(a => a.id === r.id)));
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 4) setGreeting(t("greeting_evening"));
    else if (hour < 12) setGreeting(t("greeting_morning"));
    else if (hour < 18) setGreeting(t("greeting_afternoon"));
    else setGreeting(t("greeting_evening"));

    fetchDashboardData();
  }, [t]);

  const moodButtons = [
    { label: "Happy", icon: <Sun size={24} />, color: "#FBBF24" },
    { label: "Sad", icon: <Frown size={24} />, color: "#5C6BC0" },
    { label: "Angry", icon: <Zap size={24} />, color: "#EF4444" },
    { label: "Fearful", icon: <Meh size={24} />, color: "#F59E0B" },
    { label: "Disgust", icon: <Smile size={24} />, color: "#8B5CF6" },
  ];

  return (
    <PullToRefresh onRefresh={fetchDashboardData}>
      <div className="dash-v2-page">
        <div className="dash-v2-container">
          <section className="dash-v2-hero">
            <div className="dash-v2-hero-content">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="dash-v2-welcome"
              >
                <span className="dash-v2-date">{new Date().toLocaleDateString(language === 'tl' ? 'tl-PH' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <h1>{greeting}, <span className="v-gradient-text">{user?.firstName || user?.username || "Companion"}</span>.</h1>
                <p>{t("welcome_back")}</p>

                <div className="dash-v2-mood-check">
                  <p className="check-label">{t("how_feeling")}</p>
                  <div className="mood-btn-group">
                    {moodButtons.map(m => (
                      <button key={m.label} className="mood-pill" onClick={() => navigate("/activities/mood-tracker")}>
                        <span className="mood-pill-icon" style={{ color: m.color }}>{m.icon}</span>
                        <span className="mood-pill-label">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="vera-ai-card-wrap"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="vera-ai-card">
                  <div className="vera-ai-avatar">
                    <div className="vera-ai-avatar-inner pro-ai-avatar">
                      <div className="ai-core-pulse"></div>
                      <div className="ai-core-ring"></div>
                      <Mic className="ai-core-icon" size={44} />
                    </div>
                    <div className="vera-ai-status-dot"></div>
                  </div>

                  <h2 className="vera-ai-title">V.E.R.A. AI</h2>
                  <p className="vera-ai-subtitle">{t("attuned_active")}</p>

                  <div className="vera-ai-quote-box">
                    <p className="vera-ai-quote">
                      "{veraQuote}"
                    </p>
                    <hr className="vera-ai-divider" />
                    <div className="vera-ai-sync">
                      <span>{t("sync_depth")}</span>
                      <span className="sync-value">{syncDepth}%</span>
                    </div>
                  </div>

                  <button className="vera-ai-talk-btn" onClick={() => navigate("/chat")}>
                    {t("talk_vera")}
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="dash-v2-grid">
            <div className="dash-v2-card-large glass-card" onClick={() => navigate("/avatar")}>
              <div className="card-tag"><Sparkles size={14} /> {t("avatar_immersion")}</div>
              <h3>{t("interactive_avatar_session")}</h3>
              <p>{t("avatar_desc")}</p>
              <div className="card-footer">
                <span className="card-link">{t("launch_avatar")}</span>
                <div className="card-icon-circle"><MessageCircle size={20} /></div>
              </div>
            </div>

            <div className="dash-v2-card-small stats-card">
              <div className="stats-header">
                <Zap size={18} color="#7c3aed" fill="#7c3aed" />
                <span>{t("vitality")}</span>
              </div>
              <div className="stats-main">
                <span className="stats-num">{vitality}%</span>
                <div className="stats-progress-bg">
                  <div className="stats-progress-fill" style={{ width: `${vitality}%` }} />
                </div>
              </div>
              <p>{t("vitality_desc")}</p>
            </div>

            <div className="dash-v2-card-small tool-card" onClick={() => navigate("/voice")}>
              <div className="tool-icon-box"><Mic size={20} /></div>
              <h4>{t("voice_biometrics")}</h4>
              <p>{t("voice_desc")}</p>
              <ArrowRight size={16} className="tool-arrow" />
            </div>

            <div className="dash-v2-card-small tool-card" onClick={() => navigate("/activities/diary")}>
              <div className="tool-icon-box"><Book size={20} /></div>
              <h4>{t("digital_diary")}</h4>
              <p>{t("diary_desc")}</p>
              <ArrowRight size={16} className="tool-arrow" />
            </div>

            <div className="dash-v2-card-small tool-card" onClick={() => navigate("/activities/take-a-breath")}>
              <div className="tool-icon-box"><Heart size={20} /></div>
              <h4>{t("deep_breath")}</h4>
              <p>{t("breath_desc")}</p>
              <ArrowRight size={16} className="tool-arrow" />
            </div>
          </section>

          {assignedResources.length > 0 && (
            <section className="dash-recommended" style={{ marginBottom: '20px' }}>
              <div className="recommended-header">
                <h2>Assigned Resources</h2>
              </div>
              <div className="recommended-grid">
                {assignedResources.map((resource, i) => {
                  const colors = ['#0b8a4f', '#db2777', '#7c3aed', '#f59e0b', '#3b82f6'];
                  const color = colors[i % colors.length];
                  return (
                    <div className="rec-card" key={resource.id} onClick={() => window.open(resource.links?.[0] || "#", "_blank")}>
                      <div className="rec-img-wrap">
                        <img src={resource.image_url || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop"} alt={resource.title} />
                        <div className="rec-overlay"></div>
                        <span className="rec-overlay-title" style={{ background: '#db2777', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          ★ Assigned to you
                        </span>
                      </div>
                      <div className="rec-content">
                        <span className="rec-category" style={{ color }}>{resource.category || "RESOURCE"}</span>
                        <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.title}</h3>
                        <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {resource.description || "View this resource for more details."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="dash-recommended">
            <div className="recommended-header">
              <h2>{t("recommended")}</h2>
            </div>

            <div className="recommended-grid">
              {resources.length > 0 ? (
                resources.map((resource, i) => {
                  const colors = ['#0b8a4f', '#db2777', '#7c3aed', '#f59e0b', '#3b82f6'];
                  const color = colors[i % colors.length];
                  return (
                    <div className="rec-card" key={resource.id} onClick={() => window.open(resource.links?.[0] || "#", "_blank")}>
                      <div className="rec-img-wrap">
                        <img src={resource.image_url || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop"} alt={resource.title} />
                        <div className="rec-overlay"></div>
                        <span className="rec-overlay-title">{resource.title}</span>
                      </div>
                      <div className="rec-content">
                        <span className="rec-category" style={{ color }}>{resource.category || "RESOURCE"}</span>
                        <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.title}</h3>
                        <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {resource.description || "View this resource for more details."}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#6b7280', gridColumn: 'span 3', textAlign: 'center' }}>{t("no_resources")}</p>
              )}
            </div>
          </section>
        </div>

        <footer className="dash-footer">
          <div className="dash-v2-container footer-inner">
            <div className="footer-left">
              <span className="footer-logo">V.E.R.A. - Voice Emotion Recognition Application</span>
              <span className="footer-copy">{t("all_rights")}</span>
            </div>
            <div className="footer-links">
              <Link to="/privacy">{t("privacy_policy")}</Link>
              <Link to="/terms">{t("terms_service")}</Link>
            </div>
            <div className="footer-contact">
              <span className="contact-title">Contact Us</span>
              <span className="contact-info">TUP-Taguig</span>
              <span className="contact-info">Km. 14 East Service Road, Western Bicutan, Taguig City, Metro Manila, Philippines,</span>
              <span className="contact-info">voiceemotionrecog@gmail.com</span>
            </div>
          </div>
        </footer>
      </div>

      <MoodTrackerModal
        isOpen={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onLogged={() => {
          setShowMoodModal(false);
          fetchDashboardData();
        }}
      />
    </PullToRefresh>
  );
};

export default UserDashboard;
