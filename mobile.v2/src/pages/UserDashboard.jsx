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
import veraMascot from "../assets/images/vera_mascot.png";
import axiosInstance from "../utils/axios.instance.js";
import "./UserDashboard.css";

const UserDashboard = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("Good morning");
  const [vitality, setVitality] = useState(0);
  const [syncDepth, setSyncDepth] = useState(88);
  const [veraQuote, setVeraQuote] = useState("I'm noticing your vocal resonance is softer today. Would you like to try a grounding exercise?");
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 4) setGreeting("Good evening");
    else if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Fetch some basic stats
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/activities");
        const logs = res.data.activities || [];
        const newVitality = Math.min(20 + (logs.length * 5), 100);
        setVitality(newVitality);
        setSyncDepth(Math.min(100, 65 + (logs.length * 4)));

        if (newVitality >= 80) setVeraQuote("Your resonance is remarkably clear today. Let's keep this positive momentum going!");
        else if (newVitality >= 50) setVeraQuote("Your energy feels balanced. Shall we do a quick check-in to align your thoughts?");
        else setVeraQuote("I'm noticing your vocal resonance is softer today. Would you like to try a grounding exercise?");
      } catch (e) { console.error(e); }
    };
    fetchStats();

    // Fetch dynamic resources for recommendation
    const fetchResources = async () => {
      try {
        const res = await axiosInstance.get("/resources");
        setResources(res.data.resources || res.data || []);
      } catch (e) {
        console.error("Error fetching recommended resources:", e);
      }
    };
    fetchResources();
  }, []);

  const moodButtons = [
    { label: "Radiant", icon: <Sun size={24} />, color: "#FBBF24" },
    { label: "Good", icon: <Smile size={24} />, color: "#10B981" },
    { label: "Okay", icon: <Meh size={24} />, color: "#6B7280" },
    { label: "Not Great", icon: <Frown size={24} />, color: "#EF4444" },
  ];

  return (
    <div className="dash-v2-page">
      <div className="dash-v2-container">
        {/* ── TOP HERO SECTION ── */}
        <section className="dash-v2-hero">
          <div className="dash-v2-hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="dash-v2-welcome"
            >
              <span className="dash-v2-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <h1>{greeting}, <span className="v-gradient-text">{user?.firstName || user?.username || "Companion"}</span>.</h1>
              <p>Welcome back to your sanctuary. Ready to start our healing journey today?</p>

              <div className="dash-v2-mood-check">
                <p className="check-label">HOW ARE YOU FEELING?</p>
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
                <p className="vera-ai-subtitle">ATTUNED & ACTIVE</p>

                <div className="vera-ai-quote-box">
                  <p className="vera-ai-quote">
                    "{veraQuote}"
                  </p>
                  <hr className="vera-ai-divider" />
                  <div className="vera-ai-sync">
                    <span>Sync Depth</span>
                    <span className="sync-value">{syncDepth}%</span>
                  </div>
                </div>

                <button className="vera-ai-talk-btn" onClick={() => navigate("/chat")}>
                  Talk to V.E.R.A.
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CORE ACTIVITY GRID ── */}
        <section className="dash-v2-grid">
          <div className="dash-v2-card-large glass-card" onClick={() => navigate("/avatar")}>
            <div className="card-tag"><Sparkles size={14} /> AVATAR IMMERSION</div>
            <h3>Interactive Avatar Session</h3>
            <p>Step into a safe, face-to-face environment with V.E.R.A's visual avatar. Experience compassionate visual interactions, real-time facial expressions, and deeper emotional connection.</p>
            <div className="card-footer">
              <span className="card-link">Launch Avatar</span>
              <div className="card-icon-circle"><MessageCircle size={20} /></div>
            </div>
          </div>

          <div className="dash-v2-card-small stats-card">
            <div className="stats-header">
              <Zap size={18} color="#7c3aed" fill="#7c3aed" />
              <span>Current Vitality</span>
            </div>
            <div className="stats-main">
              <span className="stats-num">{vitality}%</span>
              <div className="stats-progress-bg">
                <div className="stats-progress-fill" style={{ width: `${vitality}%` }} />
              </div>
            </div>
            <p>You're doing great! Keep up the daily check-ins.</p>
          </div>

          <div className="dash-v2-card-small tool-card" onClick={() => navigate("/voice")}>
            <div className="tool-icon-box"><Mic size={20} /></div>
            <h4>Voice Biometrics</h4>
            <p>Record a clip to analyze your emotional frequency.</p>
            <ArrowRight size={16} className="tool-arrow" />
          </div>

          <div className="dash-v2-card-small tool-card" onClick={() => navigate("/activities/diary")}>
            <div className="tool-icon-box"><Book size={20} /></div>
            <h4>Digital Diary</h4>
            <p>Log your thoughts in your private encrypted journal.</p>
            <ArrowRight size={16} className="tool-arrow" />
          </div>

          <div className="dash-v2-card-small tool-card" onClick={() => navigate("/activities/take-a-breath")}>
            <div className="tool-icon-box"><Heart size={20} /></div>
            <h4>Deep Breath Reflection</h4>
            <p>A quick 3-minute guided breathing session to center yourself before moving forward.</p>
            <ArrowRight size={16} className="tool-arrow" />
          </div>
        </section>

        {/* ── RECOMMENDED SECTION ── */}
        <section className="dash-recommended">
          <div className="recommended-header">
            <h2>Recommended for Your Sanctuary</h2>
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
              <p style={{ color: '#6b7280', gridColumn: 'span 3', textAlign: 'center' }}>No recommended resources available at the moment.</p>
            )}
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="dash-footer">
        <div className="dash-v2-container footer-inner">
          <div className="footer-left">
            <span className="footer-logo">V.E.R.A.</span>
            <span className="footer-copy">© 2024 V.E.R.A. ALL RIGHTS RESERVED. PROVIDING A SANCTUARY FOR YOUR EMOTIONAL WELL-BEING.</span>
          </div>
          <div className="footer-links">
            <Link to="/privacy">PRIVACY POLICY</Link>
            <Link to="/terms">TERMS OF SERVICE</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
