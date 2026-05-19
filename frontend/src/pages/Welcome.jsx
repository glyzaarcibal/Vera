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
import { useLanguage } from "../context/LanguageContext";
import "./Welcome.css";

/* ─── Icons ─────────────────────────────────────────────────────── */
const Arrow = ({ className }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
const StarIcon = () => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const BookIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(108,99,255,.3)" }}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.747 0-3.332.477-4.5 1.253" /></svg>;
const LinkIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const SmileIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
const FrownIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
const AngryIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /><path d="M6 6 L8 8 M18 6 L16 8" /></svg>;
const AnxiousIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M12 9v2 M12 13v2" /></svg>;
const TiredIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 16h8" /><path d="M9 9h.01 M15 9h.01" /><path d="M12 6v2" /></svg>;
const RelaxedIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01 M15 9h.01" /><path d="M12 4v2" /></svg>;
const CalmIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;

// Bento Icons
const PsychologyIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.39.1.02.2-.04.2-.14v-2.11c0-.44.2-.84.53-1.12.33-.28.77-.36 1.16-.23 1.95.66 4.09-.32 4.8-2.22a4 4 0 0 0-4.33-5.38c-1.35.13-2.5.95-3.03 2.19" /><path d="M9 14h.01" /><path d="M15 14h.01" /><path d="M12 18c1.5 0 2.5-1 2.5-1" /></svg>;
const FaceIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>;
const SpaIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 10 3.5 3.5L12 17l-3.5-3.5L12 10Z" /><path d="M12 22s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z" /></svg>;
const LockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const AnalyticsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;

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
  const { t, language } = useLanguage();
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
  const [showPassword, setShowPassword] = useState(false);
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
    const timerPromise = new Promise(resolve => setTimeout(resolve, 3000));

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
      
      // Use String comparison to be safe with IDs (number vs string)
      const details = assignments
        .map(a => all.find(x => String(x.id) === String(a.resource_id)))
        .filter(Boolean);
        
      setAssignedResourceDetails(details);
    } catch (e) { 
      console.error("Error fetching assigned resources:", e); 
    }
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
      const message = err.response?.data?.message || "Invalid credentials";
      const status = err.response?.status;
      if ((status === 401 || status === 403) && (message.includes("verify") || message.includes("confirm") || message.includes("pending"))) {
        navigate("/email-verified", { state: { email: loginEmail } });
      } else {
        setLoginError(message);
      }
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
              {t('hero_title').split(',')[0]},<br />
              <span className="v-gradient-text">{t('hero_title').split(',')[1]}</span>
            </h1>
              <p className="sa sa-up sa-d2">
                {t('hero_desc')}
              </p>
              <div className="v-hero-btns sa sa-up sa-d3">
                <Link to="/register" className="v-btn-primary">{t('start_journey')}</Link>
                <Link to="/about" className="v-btn-glass">{t('about_us')}</Link>
              </div>
            </div>

            <div className="v-hero-content-right sa sa-scale sa-d2">
              {!user ? (
                <div className="v-login-glass-card">
                  <div className="v-login-header">
                    <h2>{t('welcome_back_title')}</h2>
                    <p>{t('resume_path')}</p>
                  </div>
                  <form className="v-login-form" onSubmit={handleLogin}>
                    <div className="v-input-group">
                      <label>{t('email')} <span style={{ fontSize: '10px', opacity: 0.7 }}>(Gmail only)</span></label>
                      <input
                        type="email"
                        placeholder="name@sanctuary.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="v-input-group">
                      <label>{t('password')}</label>
                      <div className="v-password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="v-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                    {loginError && <p className="v-error-text">{loginError}</p>}
                    <button type="submit" className="v-btn-submit" disabled={isLoggingIn}>
                      {isLoggingIn ? t('signing_in') : t('sign_in')}
                    </button>
                  <div className="v-form-footer">
                  
                    <Link to="/forgot-password">{t('forgot_password_link')}</Link>
                  </div>
                </form>
              </div>
            ) : (
              <div className="v-hero-illustration">
                <img src={mentalImg} alt="Mental Health" />
                <div className="v-stats-floating-card glass">
                  <div className="v-pulse-dot" />
                  <span>{t('ai_monitoring_active')}</span>
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
            <h3>{t('harmonizing_silence')}</h3>
            <p>{t('voice_biometric_desc')}</p>
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
          <h2>{t('designed_inner_calm')}</h2>
          <p>{t('multi_modal_approach')}</p>
        </div>
        <div className="v-bento-grid">
          <div className="v-bento-item v-bento-large sa sa-up">
            <div className="v-bento-info">
              <div className="v-bento-icon purple">
                <PsychologyIcon />
              </div>
              <h3>{t('voice_emotion_recognition')}</h3>
              <p>{t('voice_emotion_desc')}</p>
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
              <h3>{t('ai_avatar_companion')}</h3>
              <p>{t('avatar_companion_desc')}</p>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
              <Link to="/avatar" className="v-btn-white-outlined">{t('interact_now')}</Link>
            </div>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d2">
            <div className="v-bento-icon green">
              <SpaIcon />
            </div>
            <h3>{t('wellness_tools_title')}</h3>
            <p>{t('wellness_tools_desc')}</p>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d3">
            <div className="v-bento-icon pink">
              <LockIcon />
            </div>
            <h3>{t('encrypted_privacy_title')}</h3>
            <p>{t('encrypted_privacy_desc')}</p>
          </div>

          <div className="v-bento-item v-bento-small sa sa-up sa-d4">
            <div className="v-bento-icon yellow">
              <AnalyticsIcon />
            </div>
            <h3>{t('healing_insights_title')}</h3>
            <p>{t('healing_insights_desc')}</p>
          </div>
        </div>
      </section>

      {/* ══ MOBILE PROMO ═══════════════════════════════════ */}
      <section className="v-promo-section">
        <div className="v-promo-glass-card sa sa-up">
          <div className="v-phone-mockup-wrapper">
            <div className="v-phone-bg-glow" />
            <div className="v-phone-secondary">
              <div className="v-phone-inner-bg" />
            </div>
            <div className="v-phone-primary">
              {/* Elias UI Mockup */}
              <div className="v-elias-ui">
                <div className="v-elias-header">
                  <div className="v-ui-menu"><span></span><span></span></div>
                  <div className="v-ui-logo">V.E.R.A.</div>
                  <div className="v-ui-profile"></div>
                </div>
                <div className="v-elias-hero-card">
                  <div className="v-ui-skeleton-line short"></div>
                  <div className="v-ui-skeleton-bar">
                    <div className="v-ui-dot"></div>
                  </div>
                </div>
                <div className="v-elias-greeting">
                  <h3>Good morning, Elias</h3>
                </div>
                <div className="v-elias-actions">
                  <div className="v-ui-action-card green">
                    <SpaIcon />
                    <strong>Breathe</strong>
                  </div>
                  <div className="v-ui-action-card pink">
                    <AnalyticsIcon />
                    <strong>Check-in</strong>
                  </div>
                </div>
                <div className="v-ui-mic-fab">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="v-promo-text-content">
            <h2 className="v-promo-title">{t('promo_title').split(' Anywhere')[0]} <br /><span className="v-text-purple">{language === 'tl' ? 'Kahit Saan.' : 'Anywhere.'}</span></h2>
            <p className="v-promo-desc">{t('promo_desc')}</p>

            <div className="v-download-grid-centered">
              <div className="v-qr-card">
                <div className="v-qr-img">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/download-apk')}`} alt={t('scan_download')} />
                </div>
                <span className="v-qr-label">{t('scan_download')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ RESOURCES (Assigned) ══════════════════════ */}
      {(user?.id && assignedResourceDetails.length > 0) ? (
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
      ) : (
        /* Fallback: Show general resources if none assigned or guest */
        resources.length > 0 && (
          <section className="v-section v-resources-section">
            <div className="v-section-head sa sa-up">
              <div className="v-label-purple"><BookIcon /> Explorer</div>
              <h2>Mental Health <em>Resources</em></h2>
            </div>
            <div className="v-scroll-container">
              {resources.map((r, i) => (
                <ResourceCard key={r.id} resource={r} className="sa sa-scale" />
              ))}
            </div>
          </section>
        )
      )}

      <section className="v-cta-section sa sa-scale">
        <div className="v-cta-card emergency-card">
          <div className="v-cta-content">
            <h2>{t('emergency_title')}</h2>
            <p className="emergency-intro">{t('emergency_intro')}</p>
            
            <div className="v-emergency-grid">
              <div className="v-emergency-item">
                <strong>NCMH Crisis Hotline</strong>
                <span>1553 (Toll-free)</span>
                <span>0966-351-4518 / 0908-639-2672</span>
              </div>
              <div className="v-emergency-item">
                <strong>Hopeline Philippines</strong>
                <span>(02) 8804-4673</span>
                <span>0917-558-4673 / 0918-873-4673</span>
              </div>
              <div className="v-emergency-item">
                <strong>In Touch Community Services</strong>
                <span>(02) 8893-7603</span>
                <span>0917-800-1123 / 0922-893-8944</span>
              </div>
              <div className="v-emergency-item">
                <strong>{t('tawag_paglaum')}</strong>
                <span>0939-937-5433 / 0939-936-5433</span>
                <span>{t('national_support')}</span>
              </div>
            </div>
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
              <h2>{t('how_feeling_name').replace('{name}', user?.firstName || "there")}</h2>
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
                  <textarea placeholder={t('what_making_feel')} value={moodReason} onChange={(e) => setMoodReason(e.target.value)} />
                  <button onClick={handleSaveMood} disabled={isSavingMood} className="v-mood-save" style={{ background: selectedMood.color }}>{isSavingMood ? t('saving') : t('save_entry')}</button>
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
            <div className="logo">V.E.R.A. - Voice Emotion Recognition Application</div>
            <p>© 2026 V.E.R.A. - Voice Emotion Recognition Application. All rights reserved. Providing a sanctuary for your emotional well-being.</p>
          </div>
          <div className="v-footer-links">
            <Link to="/privacy">{t('privacy_policy')}</Link>
            <Link to="/terms">{t('terms_service')}</Link>
          </div>
          <div className="v-footer-contact">
            <h4>{t('contact_us')}</h4>
            <p>TUP-Taguig</p>
            <p>Km. 14 East Service Road, Western Bicutan, Taguig City, Metro Manila, Philippines,</p>
            <p>voiceemotionrecog@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;