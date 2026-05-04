import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import ModalPortal from "../components/ModalPortal";
import mentalImg from "../assets/mental.png";
import voiceWaveImg from "../assets/voice-wave.png";
import qrCodeImg from "../assets/qr-code.png";
import { setUser } from "../store/slices/authSlice";
import Loader from "../components/Loader";
import "./Welcome.css";

/* ─── Icons ─────────────────────────────────────────────────────── */
const Arrow = ({ className }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
const StarIcon = () => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const BookIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(108,99,255,.3)" }}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.747 0-3.332.477-4.5 1.253" /></svg>;
const LinkIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const SmileIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
const FrownIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
const AngryIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M6 6 L8 8 M18 6 L16 8"/></svg>;
const AnxiousIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M12 9v2 M12 13v2"/></svg>;
const TiredIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 16h8"/><path d="M9 9h.01 M15 9h.01"/><path d="M12 6v2"/></svg>;
const RelaxedIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01 M15 9h.01"/><path d="M12 4v2"/></svg>;
const CalmIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// Bento Icons
const PsychologyIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.39.1.02.2-.04.2-.14v-2.11c0-.44.2-.84.53-1.12.33-.28.77-.36 1.16-.23 1.95.66 4.09-.32 4.8-2.22a4 4 0 0 0-4.33-5.38c-1.35.13-2.5.95-3.03 2.19" /><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M12 18c1.5 0 2.5-1 2.5-1"/></svg>;
const FaceIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
const SpaIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 10 3.5 3.5L12 17l-3.5-3.5L12 10Z"/><path d="M12 22s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z"/></svg>;
const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const AnalyticsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

/* ─── Components ─────────────────────────────────────────────────── */
const ResourceCard = ({ resource, className = "" }) => {
  const domain = (url) => { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } };
  return (
    <div className={`v-res-card ${className}`}>
      {resource.image_url
        ? <div className="v-res-img-wrap"><img src={resource.image_url} alt={resource.title} className="v-res-img" /></div>
        : <div className="v-res-placeholder"><BookIcon /></div>
      }
      <div className="v-res-body">
        {resource.category && <span className="v-tag">{resource.category}</span>}
        <h4 className="v-res-title">{resource.title}</h4>
        <p className="v-res-desc">{resource.description}</p>
        {resource.links?.length > 0 && (
          <div className="v-links-row">
            {resource.links.slice(0, 2).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="v-link-chip" title={link}>
                <LinkIcon />{domain(link)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Welcome = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodReason, setMoodReason] = useState("");
  const [isSavingMood, setIsSavingMood] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const moodsList = [
    { mood: "Happy", icon: <SmileIcon />, color: "#FFD700" },
    { mood: "Sad", icon: <FrownIcon />, color: "#5C6BC0" },
    { mood: "Angry", icon: <AngryIcon />, color: "#EF5350" },
    { mood: "Anxious", icon: <AnxiousIcon />, color: "#FFA726" },
    { mood: "Tired", icon: <TiredIcon />, color: "#8D6E63" },
    { mood: "Relaxed", icon: <RelaxedIcon />, color: "#66BB6A" },
    { mood: "Calm", icon: <CalmIcon />, color: "#26A69A" },
  ];

  useEffect(() => {
    // Initial animation triggers & progress bar logic
    const bar = document.createElement("div"); bar.className = "v-progress"; document.body.appendChild(bar);
    const onScroll = () => {
      const d = document.documentElement;
      bar.style.width = `${Math.min((d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100, 100)}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Intersection Observer for scroll animations
    const els = document.querySelectorAll(".sa");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
        }
      });
    }, { threshold: .1 });
    els.forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      bar.remove();
    };
  }, [loading]);

  useEffect(() => {
    fetchData();
    if (user?.id) checkMoodEntry();
  }, [user?.id]);

  const fetchData = async () => { 
    setLoading(true); 
    // Wait for at least 10 seconds AND for data to load
    const dataPromise = Promise.all([
      fetchResources(),
      user?.id ? fetchAssignedResources() : Promise.resolve()
    ]);
    const timerPromise = new Promise(resolve => setTimeout(resolve, 10000));
    
    await Promise.all([dataPromise, timerPromise]);
    setLoading(false); 
  };

  const fetchResources = async () => {
    try {
      const r = await axiosInstance.get("/resources");
      setResources(r.data.resources || r.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAssignedResources = async () => {
    try {
      const r = await axiosInstance.get(`/resources/get-assignments/${user.id}`);
      const assignments = r.data.assignments || [];
      const allRes = await axiosInstance.get("/resources");
      const all = allRes.data.resources || allRes.data.data || [];
      setAssignedResourceDetails(assignments.map(a => all.find(x => x.id === a.resource_id)).filter(Boolean));
    } catch (e) { console.error(e); }
  };

  const checkMoodEntry = async () => {
    if (sessionStorage.getItem("moodPopupShown") === "true") return;
    try {
      const response = await axiosInstance.get(`/activities/${user.id}`);
      const activities = response.data.activities || [];
      const today = new Date().toLocaleDateString();
      const moodToday = activities.find(act => act.activity_type === "mood" && act.data?.date === today);
      if (!moodToday) setShowMoodPopup(true);
      else sessionStorage.setItem("moodPopupShown", "true");
    } catch (error) { console.error(error); }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user?.id) return;
    setIsSavingMood(true);
    try {
      await axiosInstance.post("/activities/save", {
        userId: user.id,
        activityType: "mood",
        data: { mood: selectedMood.mood, moodIcon: selectedMood.mood, moodColor: selectedMood.color, reason: moodReason, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() }
      });
      setShowMoodPopup(false);
      sessionStorage.setItem("moodPopupShown", "true");
    } catch (error) { console.error(error); } finally { setIsSavingMood(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const response = await axiosInstance.post("/auth/login", { email: loginEmail, password: loginPassword });
      if (response.data.profile) {
        dispatch(setUser(response.data.profile));
        navigate("/dashboard");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="v-welcome-page">
      {/* ══ HERO SECTION ══════════════════════════════════ */}
      <section className="v-hero-wrap">
        <div className="v-hero-container">
          <div className="v-hero-content-left">
           
            <h1 className="sa sa-up sa-d1">
              Your Voice,<br />
              <span className="v-gradient-text">Your Healing.</span>
            </h1>
            <p className="sa sa-up sa-d2">
              V.E.R.A. is your digital sanctuary. Through empathetic AI, we translate 
              the nuances of your voice into a guided path toward emotional balance.
            </p>
            <div className="v-hero-btns sa sa-up sa-d3">
              <Link to="/about" className="v-btn-primary">Start Your Journey</Link>
              <a href="#how-it-works" className="v-btn-glass">How it Works</a>
            </div>
          </div>

          <div className="v-hero-content-right sa sa-scale sa-d2">
            {!user ? (
              <div className="v-login-glass-card">
                <div className="v-login-header">
                  <h2>Welcome Back</h2>
                  <p>Resume your path to clarity</p>
                </div>
                <form className="v-login-form" onSubmit={handleLogin}>
                  <div className="v-input-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="name@sanctuary.com" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="v-input-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && <p className="v-error-text">{loginError}</p>}
                  <button type="submit" className="v-btn-submit" disabled={isLoggingIn}>
                    {isLoggingIn ? "Signing In..." : "Sign In to V.E.R.A."}
                  </button>
                  <div className="v-form-footer">
                    <Link to="/register">Create Account</Link>
                    <Link to="/forgot-password">Forgot Password?</Link>
                  </div>
                </form>
              </div>
            ) : (
              <div className="v-hero-illustration">
                <img src={mentalImg} alt="Mental Health" />
                <div className="v-stats-floating-card glass">
                  <div className="v-pulse-dot" />
                  <span>AI Real-time Monitoring Active</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ BREATHING VISUALIZER ═══════════════════════════ */}
      <section className="v-breaker-section" id="how-it-works">
        <div className="v-breathing-card glass sa sa-up">
          <div className="v-breaker-text">
            <h3>Harmonizing Your Silence</h3>
            <p>Our voice biometric engine detects over 40 distinct emotional markers in your speech, providing real-time insights into your subconscious well-being.</p>
          </div>
          <div className="v-visualizer-orb">
            <div className="v-orb-outer">
              <div className="v-orb-inner">
                 <span className="material-symbols-outlined"></span>
              </div>
            </div>
            <div className="v-ping-1" />
            <div className="v-ping-2" />
          </div>
        </div>
      </section>

      {/* ══ BENTO FEATURES ════════════════════════════════ */}
      <section className="v-bento-section">
        <div className="v-section-head sa sa-up">
          <h2>Designed for Your Inner Calm</h2>
          <p>A multi-modal approach to therapeutic AI companionship.</p>
        </div>
        <div className="v-bento-grid">
          <div className="v-bento-item v-bento-large sa sa-up">
            <div className="v-bento-info">
              <div className="v-bento-icon purple">
                <PsychologyIcon />
              </div>
              <h3>Voice Emotion Recognition</h3>
              <p>Real-time analysis of tone, pitch, and cadence to understand your emotional state beyond just words.</p>
            </div>
            <div className="v-bento-img">
              <img src={voiceWaveImg} alt="Voice Wave Viz" />
            </div>
          </div>
          
          <div className="v-bento-item v-bento-vertical sa sa-up sa-d1">
            <div className="v-bento-info">
              <div className="v-bento-icon white">
                <FaceIcon />
              </div>
              <h3>AI Avatar Companion</h3>
              <p>Meet Vera, your empathetic guide who evolves with you, learning your preferences and triggers to offer personalized support.</p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
              <Link to="/avatar" className="v-btn-white-outlined">Interact Now</Link>
            </div>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d2">
            <div className="v-bento-icon green">
              <SpaIcon />
            </div>
            <h3>Wellness Tools</h3>
            <p>Integrated breathing exercises and grounding techniques tailored to your current heart-rate and voice stress levels.</p>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d3">
            <div className="v-bento-icon pink">
              <LockIcon />
            </div>
            <h3>Encrypted Privacy</h3>
            <p>Your emotional data is your own. We use end-to-end encryption to ensure your sanctuary remains private and secure.</p>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d4">
            <div className="v-bento-icon yellow">
              <AnalyticsIcon />
            </div>
            <h3>Healing Insights</h3>
            <p>Detailed weekly reports that visualize your emotional journey and suggest long-term habits for mental resilience.</p>
          </div>
        </div>
      </section>


      {/* ══ RESOURCES (Existing Logic) ══════════════════════ */}
      {(user?.id && assignedResourceDetails.length > 0) && (
        <section className="v-section v-resources-section">
          <div className="v-section-head sa sa-up">
             <div className="v-label-gold"><StarIcon /> Personalized for you</div>
             <h2>Suggested <em>Resources</em></h2>
          </div>
          <div className="v-scroll-container">
            {assignedResourceDetails.map((r, i) => (
              <ResourceCard key={r.id} resource={r} className="sa sa-scale" />
            ))}
          </div>
        </section>
      )}

      {/* ══ CTA SECTION ════════════════════════════════════ */}
      <section className="v-cta-section sa sa-scale">
        <div className="v-cta-card">
          <div className="v-cta-content">
            <h2>Ready to find your voice?</h2>
            <p>Join over 50,000 users who have discovered a new way to heal through the power of empathy and technology.</p>
            <Link to="/register" className="v-btn-cta">Get Started for Free</Link>
          </div>
        </div>
      </section>

      {/* ══ MOOD POPUP ═════════════════════════════════════ */}
      {showMoodPopup && (
        <ModalPortal>
          <div className="v-mood-overlay">
            <div className="v-mood-modal">
              <div className="v-mood-bar" />
              <button onClick={() => { setShowMoodPopup(false); sessionStorage.setItem("moodPopupShown", "true"); }} className="v-mood-close"><XIcon /></button>
              <h2>How are you feeling, <span className="v-mood-name">{user?.firstName || "there"}</span>?</h2>
              <div className="v-mood-grid">
                {moodsList.map((m) => (
                  <button key={m.mood} onClick={() => setSelectedMood(m)} className={`v-mood-opt ${selectedMood?.mood === m.mood ? 'active' : ''}`} style={selectedMood?.mood === m.mood ? { borderColor: m.color } : {}}>
                    <span className="v-mood-ico" style={selectedMood?.mood === m.mood ? { color: m.color } : {}}>{m.icon}</span>
                    <span className="v-mood-lbl">{m.mood}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <div className="v-mood-reason-container">
                  <textarea placeholder="What's making you feel this way?" value={moodReason} onChange={(e) => setMoodReason(e.target.value)} />
                  <button onClick={handleSaveMood} disabled={isSavingMood} className="v-mood-save" style={{ background: selectedMood.color }}>{isSavingMood ? "Saving..." : "Save Entry"}</button>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="v-main-footer sa sa-up">
        <div className="v-footer-top">
          <div className="v-footer-brand">
            <div className="logo">V.E.R.A.</div>
            <p>© 2024 V.E.R.A. All rights reserved. Providing a sanctuary for your emotional well-being.</p>
          </div>
          <div className="v-footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;