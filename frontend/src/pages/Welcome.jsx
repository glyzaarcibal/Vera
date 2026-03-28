import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSelectors";
import axiosInstance from "../utils/axios.instance";
import ModalPortal from "../components/ModalPortal";


/* ─── Icons ─────────────────────────────────────────────────────── */
const Mic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const Chat = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const ChartBar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const BookIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(108,99,255,.3)" }}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const LinkIcon = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const StarIcon = () => <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const Arrow = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;

/* ─── ResourceCard ───────────────────────────────────────────────── */
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
            {resource.links.length > 2 && <span style={{ fontSize: ".7rem", color: "var(--muted)", fontFamily: "'DM Mono',monospace" }}>+{resource.links.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Welcome ────────────────────────────────────────────────────── */
const Welcome = () => {
  const user = useSelector(selectUser);
  const [resources, setResources] = useState([]);
  const [assignedResourceDetails, setAssignedResourceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodReason, setMoodReason] = useState("");
  const [isSavingMood, setIsSavingMood] = useState(false);

  const moodsList = [
    { mood: "Happy", emoji: "😊", color: "#FFD700", animation: "/animations/happy.json" },
    { mood: "Sad", emoji: "😢", color: "#5C6BC0", animation: "/animations/sad.json" },
    { mood: "Angry", emoji: "😠", color: "#EF5350", animation: "/animations/angry.json" },
    { mood: "Anxious", emoji: "😰", color: "#FFA726", animation: "/animations/anxious.json" },
    { mood: "Tired", emoji: "😴", color: "#8D6E63", animation: "/animations/tired.json" },
    { mood: "Relaxed", emoji: "😌", color: "#66BB6A", animation: "/animations/relax.json" },
    { mood: "Calm", emoji: "😊", color: "#26A69A", animation: "/animations/content.json" },
  ];

  // Remove global CSS injection

  /* DOM effects */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const orbs = [1, 2, 3].map(n => {
      const o = document.createElement("div"); o.className = `v-orb v-orb-${n}`;
      document.body.appendChild(o); return o;
    });

    const bar = document.createElement("div"); bar.className = "v-progress"; document.body.appendChild(bar);

    const btn = document.createElement("button"); btn.className = "v-top-btn"; btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
    btn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    document.body.appendChild(btn);

    const onScroll = () => {
      const d = document.documentElement;
      bar.style.width = `${Math.min((d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100, 100)}%`;
      btn.classList.toggle("show", d.scrollTop > 380);
      if (!reduced) { const h = document.querySelector(".v-hero"); if (h) h.style.transform = `translateY(${d.scrollTop * .12}px)`; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const els = document.querySelectorAll(".sa");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          if (e.target.classList.contains("sa-shimmer") && !e.target.dataset.shimmered) {
            e.target.dataset.shimmered = "1";
            const delay = parseFloat(getComputedStyle(e.target).transitionDelay) * 1000 || 0;
            setTimeout(() => e.target.classList.add("sa-shimmer-run"), delay + 280);
          }
        } else {
          e.target.classList.remove("visible", "sa-shimmer-run");
          delete e.target.dataset.shimmered;
        }
      });
    }, { threshold: .08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
      orbs.forEach(o => o.remove());
      bar.remove(); btn.remove();
    };
  }, [loading]);

  useEffect(() => {
    fetchData();
    checkMoodEntry();
  }, [user?.id]);

  const checkMoodEntry = async () => {
    if (!user?.id) return;

    // Check if we've already shown it this session
    if (sessionStorage.getItem("moodPopupShown") === "true") return;

    try {
      const response = await axiosInstance.get(`/activities/${user.id}`);
      const activities = response.data.activities || [];

      const today = new Date().toLocaleDateString();
      const moodToday = activities.find(
        act => act.activity_type === "mood" && act.data?.date === today
      );

      if (!moodToday) {
        setShowMoodPopup(true);
      } else {
        sessionStorage.setItem("moodPopupShown", "true");
      }
    } catch (error) {
      console.error("Error checking mood entry:", error);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user?.id) return;

    setIsSavingMood(true);
    const newEntry = {
      mood: selectedMood.mood,
      moodEmoji: selectedMood.emoji,
      moodColor: selectedMood.color,
      reason: moodReason,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };

    try {
      await axiosInstance.post("/activities/save", {
        userId: user.id,
        activityType: "mood",
        data: newEntry
      });
      setShowMoodPopup(false);
      sessionStorage.setItem("moodPopupShown", "true");
    } catch (error) {
      console.error("Error saving mood from popup:", error);
    } finally {
      setIsSavingMood(false);
    }
  };

  const normalizeResources = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.resources)) return payload.resources;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const fetchData = async () => { setLoading(true); await fetchResources(); if (user?.id) await fetchAssignedResources(); setLoading(false); };
  const fetchResources = async () => {
    try {
      const r = await axiosInstance.get("/resources");
      setResources(normalizeResources(r.data));
    } catch (e) {
      console.error(e);
      setResources([]);
    }
  };
  const fetchAssignedResources = async () => {
    try {
      const r = await axiosInstance.get(`/resources/get-assignments/${user.id}`);
      const assignments = r.data.assignments || [];
      const all = normalizeResources((await axiosInstance.get("/resources")).data);
      setAssignedResourceDetails(assignments.map(a => all.find(x => x.id === a.resource_id)).filter(Boolean));
    } catch (e) { console.error(e); }
  };
  const domain = url => { try { return new URL(url).hostname.replace("www.", ""); } catch { return url; } };

  const validResources = Array.isArray(resources) ? resources : [];
  const featuredResource = validResources[0];
  const otherResources = validResources.slice(1, 7);

  if (loading) return (
    <div className="v-loading">
      {/* No global CSS injected here */}
      <div className="v-spinner" />
      <p className="v-loading-text">Loading your experience</p>
    </div>
  );

  return (
    <div>
      {/* No global CSS injected here */}
      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="v-hero">
        <div className="v-hero-floats">
          <div className="v-float v-float-1">
            <div className="v-float-icon" style={{ background: "linear-gradient(135deg,#ede9fe,#ddd6fe)" }}>🎙️</div>
            <div><div className="v-float-title">Voice Analysis</div><div className="v-float-sub">AI-powered</div></div>
          </div>
          <div className="v-float v-float-2">
            <div className="v-float-icon" style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>✅</div>
            <div><div className="v-float-title">100% Private</div><div className="v-float-sub">End-to-end secure</div></div>
          </div>
          <div className="v-float v-float-3">
            <div className="v-float-icon" style={{ background: "linear-gradient(135deg,#fce7f3,#fbcfe8)" }}>💙</div>
            <div><div className="v-float-title">24 / 7 Support</div><div className="v-float-sub">Always here for you</div></div>
          </div>
        </div>

        <span className="sa sa-drop sa-d0 v-eyebrow">
          <span className="v-eyebrow-dot" />
          Mental Health Support
        </span>

        <h1 className="sa sa-up sa-d1 v-hero-title">
          Welcome to <span className="v-hero-title-accent">V.E.R.A.</span>
        </h1>

        <p className="sa sa-up sa-d2 v-hero-mono">Voice Emotion Recognition Application</p>

        <p className="sa sa-blr sa-d3 v-hero-desc">
          Your AI-powered companion for mental well-being, offering support through
          voice recognition, predictive analytics, and emotional tracking.
        </p>

        <Link to="/about" className="sa sa-scale sa-d4 v-btn-primary">
          Discover more <Arrow />
        </Link>

        <div className="v-scroll-hint">
          <span>Scroll</span>
          <div className="v-scroll-line" />
        </div>
      </section>


      {/* ══ FEATURES ═══════════════════════════════════════ */}
      <div className="v-section">
        <div className="v-section-head">
          <span className="sa sa-up sa-d0 v-label">What we offer</span>
          <h2 className="sa sa-up sa-d1 v-heading">Designed for your <em>well-being</em></h2>
          <p className="sa sa-up sa-d2 v-sub">Intelligent tools that understand, adapt, and grow with your emotional journey.</p>
        </div>
        <div className="v-feat-grid">
          {[
            { num: "01", icon: <Mic />, title: "Voice Emotion Recognition", desc: "Express yourself naturally and let our AI understand your emotional state through advanced voice analysis." },
            { num: "02", icon: <Chat />, title: "AI Chatbot Support", desc: "Get immediate emotional support and mental health first aid whenever you need it, day or night." },
            { num: "03", icon: <ChartBar />, title: "Mood Tracking", desc: "Monitor your emotional patterns and gain valuable insights into your mental wellness journey over time." },
            { num: "04", icon: <ClockIcon />, title: "Predictive Analytics", desc: "Early detection of emotional distress patterns to provide timely, compassionate assistance." },
          ].map((f, i) => (
            <div key={f.num} className={`sa sa-up sa-d${i} v-feat-card sa-shimmer`}>
              <div className="v-feat-num">{f.num}</div>
              <div className="v-feat-icon">{f.icon}</div>
              <div className="v-feat-title">{f.title}</div>
              <p className="v-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="v-divider" />

      {/* ══ MOBILE APP PROMO ═══════════════════════════════ */}
      <div className="v-section" style={{ background: "linear-gradient(135deg, rgba(108, 99, 255, 0.04) 0%, rgba(167, 139, 250, 0.05) 100%)", borderRadius: "32px", padding: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px", flexWrap: "wrap", border: "1px solid rgba(108, 99, 255, 0.1)" }}>
        <div style={{ flex: "1 1 400px" }}>
          <span className="sa sa-up sa-d0 v-label">V.E.R.A for Mobile</span>
          <h2 className="sa sa-up sa-d1 v-heading" style={{ marginBottom: "20px", fontSize: "36px" }}>Take your wellness <em>anywhere</em></h2>
          <p className="sa sa-up sa-d2 v-sub" style={{ fontSize: "18px", color: "var(--muted)" }}>
            Download the V.E.R.A mobile app to get 24/7 access to AI support, emotion tracking, and customized mental health resources right in your pocket. 
          </p>
        </div>

        {/* Mock Mobile Phone Frame */}
        <div className="sa sa-scale sa-d2" style={{ 
          position: "relative",
          width: "280px", 
          height: "540px", 
          background: "#2d3748", /* Dark sleek phone body */
          padding: "50px 14px 60px 14px", /* Thick top and bottom bezels */
          borderRadius: "40px", 
          boxShadow: "0 30px 60px rgba(108, 99, 255, 0.2)", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          flexShrink: 0, 
          margin: "auto",
          border: "4px solid #1a202c"
        }}>
          {/* Top Speaker/Camera */}
          <div style={{ position: "absolute", top: "22px", display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4a5568" }} />
            <div style={{ width: "40px", height: "6px", borderRadius: "3px", background: "#4a5568" }} />
          </div>

          {/* Phone Screen */}
          <div style={{
            width: "100%",
            height: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            position: "relative",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)"
          }}>
            {/* Top Text inside Screen removed */}

            {/* QR Code container with scanner brackets */}
            <div style={{ position: "relative", padding: "16px", marginBottom: "30px", background: "#f8fafc", borderRadius: "16px" }}>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=Download+VERA+App&color=25164d" alt="Scan QR Code" style={{ width: "160px", height: "160px", mixBlendMode: "multiply" }} />
              
              {/* Animated Scanner Bracket Corners */}
              <div style={{ position: "absolute", top: "0", left: "0", width: "20px", height: "20px", borderTop: "3px solid #6c63ff", borderLeft: "3px solid #6c63ff", borderRadius: "8px 0 0 0" }} />
              <div style={{ position: "absolute", top: "0", right: "0", width: "20px", height: "20px", borderTop: "3px solid #6c63ff", borderRight: "3px solid #6c63ff", borderRadius: "0 8px 0 0" }} />
              <div style={{ position: "absolute", bottom: "0", left: "0", width: "20px", height: "20px", borderBottom: "3px solid #6c63ff", borderLeft: "3px solid #6c63ff", borderRadius: "0 0 0 8px" }} />
              <div style={{ position: "absolute", bottom: "0", right: "0", width: "20px", height: "20px", borderBottom: "3px solid #6c63ff", borderRight: "3px solid #6c63ff", borderRadius: "0 0 8px 0" }} />
            </div>

            {/* Scan Now button pill */}
            <div style={{ 
               background: "#e8e6ff", 
               color: "#6c63ff", 
               padding: "12px 32px", 
               borderRadius: "50px", 
               fontWeight: "800", 
               fontSize: "14px", 
               letterSpacing: "1px",
               textTransform: "uppercase",
               boxShadow: "0 4px 15px rgba(108, 99, 255, 0.15)"
            }}>
               Scan Now
            </div>
          </div>

          {/* Bottom Home Button */}
          <div style={{ position: "absolute", bottom: "15px", width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #4a5568", display: "flex", justifyContent: "center", alignItems: "center", background: "#323743" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "4px", border: "1.5px solid #4a5568" }} />
          </div>
        </div>
      </div>

      <div className="v-divider" />

      {/* ══ SUGGESTED RESOURCES ════════════════════════════ */}
      {user?.id && assignedResourceDetails.length > 0 && (
        <>
          <div className="v-sug-wrap">
            <div className="v-section">
              <div className="v-section-head">
                <div className="sa sa-up sa-d0 v-sug-badge"><StarIcon /> Personalized for you</div>
                <h2 className="sa sa-up sa-d1 v-heading">Suggested <em>Resources</em></h2>
                <p className="sa sa-up sa-d2 v-sub">Curated by your advisor to support your unique mental wellness path.</p>
              </div>
              <div className="v-scroll-row">
                {assignedResourceDetails.map((r, i) => (
                  <ResourceCard key={r.id} resource={r} className={`sa sa-scale sa-d${Math.min(i, 6)} sa-shimmer`} />
                ))}
              </div>
            </div>
          </div>
          <div className="v-divider" />
        </>
      )}

      {/* ══ ALL RESOURCES ══════════════════════════════════ */}
      {resourcesList.length > 0 && (
        <div className="v-section">
          <div className="v-section-head">
            <span className="sa sa-up sa-d0 v-label">Library</span>
            <h2 className="sa sa-up sa-d1 v-heading">Helpful <em>Resources</em></h2>
            <p className="sa sa-up sa-d2 v-sub">Explore curated content and tools to support your mental wellness journey.</p>
          </div>

          {featuredResource && (
            <div className="sa sa-scale sa-d0 v-featured">
              <div className="v-feat-media">
                {featuredResource.image_url
                  ? <img src={featuredResource.image_url} alt={featuredResource.title} />
                  : <div className="v-feat-ph"><BookIcon /></div>
                }
                <span className="v-feat-badge">Featured</span>
              </div>
              <div className="v-feat-body">
                {featuredResource.category && <span className="v-tag">{featuredResource.category}</span>}
                <h3 className="v-feat-big-title">{featuredResource.title}</h3>
                <p className="v-feat-big-desc">{featuredResource.description}</p>
                {featuredResource.links?.length > 0 && (
                  <div className="v-links-row">
                    {featuredResource.links.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="v-link-chip" title={link}>
                        <LinkIcon />{domain(link)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {otherResources.length > 0 && (
            <div className="v-res-grid">
              {otherResources.map((r, i) => (
                <ResourceCard key={r.id} resource={r} className={`sa sa-up sa-d${i % 5} sa-shimmer`} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="v-divider" />

      {/* ══ FOOTER ═════════════════════════════════════════ */}
      <footer className="v-footer">
        <p className="sa sa-up sa-d0 v-footer-text">A safe, accessible, and stigma-free platform for mental health support.</p>
        <Link to="/about" className="sa sa-up sa-d1 v-footer-link">Learn more about our mission <Arrow /></Link>
      </footer>

      {/* Mood Popup Modal */}
      {showMoodPopup && (
        <ModalPortal>
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px",
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            background: "white",
            borderRadius: "32px",
            padding: "40px",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "8px",
              background: "linear-gradient(90deg, #6c63ff, #a78bfa, #06d6c7)"
            }} />

            <button
              onClick={() => {
                setShowMoodPopup(false);
                sessionStorage.setItem("moodPopupShown", "true");
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#9490a8"
              }}
            >
              ×
            </button>

            <h2 style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1a1625",
              marginBottom: "12px"
            }}>
              How are you feeling, <span className="v-hero-title-accent" style={{ fontStyle: "normal", background: "none", WebkitTextFillColor: "var(--acc-a)" }}>{user?.firstName || "there"}</span>?
            </h2>
            <p style={{ color: "#4a4568", marginBottom: "32px", fontSize: "16px" }}>
              Take a moment to check in with yourself.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "32px"
            }}>
              {moodsList.map((m) => (
                <button
                  key={m.mood}
                  onClick={() => setSelectedMood(m)}
                  style={{
                    padding: "16px 8px",
                    borderRadius: "20px",
                    border: selectedMood?.mood === m.mood ? `2px solid ${m.color}` : "2px solid #f0f0f5",
                    background: selectedMood?.mood === m.mood ? `${m.color}15` : "white",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{m.emoji}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a1625", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.mood}</span>
                </button>
              ))}
            </div>

            {selectedMood && (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <textarea
                  placeholder="What's making you feel this way? (Optional)"
                  value={moodReason}
                  onChange={(e) => setMoodReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    background: "#f8f7fc",
                    marginBottom: "24px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "none",
                    height: "80px",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#6c63ff"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />

                <button
                  onClick={handleSaveMood}
                  disabled={isSavingMood}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "100px",
                    background: "var(--acc-a)",
                    color: "white",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(108,99,255,0.2)",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {isSavingMood ? "Saving..." : "Save Entry"}
                </button>
              </div>
            )}
          </div>
        </div>
        </ModalPortal>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Welcome;
