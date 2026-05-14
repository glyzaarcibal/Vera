import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Menu, X, Bell, LogOut, User, Activity, LayoutDashboard, Sparkles, ChevronDown, Mic, MessageSquare, UserCircle, Calendar, Clock, Zap } from "lucide-react";
import axiosInstance from "../utils/axios.instance";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSelectors";
import { store, persistor } from "../store/store";
import { clearUser } from "../store/slices/authSlice";
import { useLanguage } from "../context/LanguageContext";
import logoImg from "../assets/logo.png";
import "./Header.css";

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen) fetchNotifications();
  };
  const isActive = (path) => location.pathname === path;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get("/profile/fetch-sessions");
      const { chat_sessions } = res.data;

      const appointmentNotifications = (chat_sessions || [])
        .flatMap((session) =>
          (session.doctor_notes || [])
            .filter((note) => note.next_appointment)
            .map((note) => ({
              id: `apt-${note.id}`,
              title: "Appointment Scheduled",
              message: `Dr. ${note.profiles?.first_name || ""} ${note.profiles?.last_name || "Unknown"} has scheduled your session.`,
              time: new Date(note.created_at).toLocaleDateString(),
              date: note.next_appointment,
              type: "appointment",
            }))
        );

      const staticNotifications = [
        {
          id: 'feat-1',
          title: "Emotion Recognition",
          message: "Analyze your voice for deep emotional insights.",
          time: "Recently Added",
          type: "update",
        },
      ];

      const all = [...appointmentNotifications, ...staticNotifications];
      const clearedIds = JSON.parse(localStorage.getItem('clearedNotifications') || '[]');
      const filtered = all.filter(n => !clearedIds.includes(n.id));

      setNotifications(filtered);
      setUnreadCount(filtered.length);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    // 1. Clear Redux and Local State Immediately
    dispatch(clearUser());
    
    try {
      // 2. Clear all related local storage items
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("clearedNotifications");
      localStorage.clear(); // Nuclear local clear
      
      if (persistor) {
        await persistor.purge();
      }

      // 3. Call backend to clear cookies
      await axiosInstance.post("/auth/logout");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      // 4. Force hard redirect to landing page
      window.location.href = "/";
    }
  };

  return (
    <header className="header">
      <nav className="header-nav">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <img src={logoImg} alt="V.E.R.A. Logo" className="logo-img" />
          </Link>
        </div>

        <div className={`header-links ${isMenuOpen ? "show" : ""}`}>
          <div className="mobile-only mobile-menu-header">
            <div
              className="mobile-user-profile"
              onClick={() => {
                navigate("/profile");
                setIsMenuOpen(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="mobile-avatar">
                {!location.pathname.startsWith("/admin") && !location.pathname.startsWith("/psychology") && (
                  user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" />
                  ) : (
                    <UserCircle size={40} />
                  )
                )}
              </div>
              <div className="mobile-user-info">
                <p className="mobile-user-name">{user?.username || user?.first_name || "User"}</p>
                {isAuthenticated && !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/psychology") && (
                  <div className="mobile-token-pill">
                    <span>🪙</span>
                    <span>{user?.tokens ?? 0}</span>
                  </div>
                )}
              </div>
            </div>
            <button className="mobile-menu-close" onClick={toggleMenu}>
              <X size={24} />
            </button>
          </div>

          <Link to="/" className={`header-link ${isActive("/") ? "active" : ""}`}>
            <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
            <span>{t("home")}</span>
          </Link>

          <div className="desktop-ai-dropdown">
            <div className="header-link dropdown-trigger">
              <span className="header-link-icon mobile-only"><Sparkles size={18} /></span>
              <span>{t("ai_features")}</span>
              <ChevronDown size={14} className="dropdown-arrow-icon" />
            </div>
            <div className="desktop-ai-menu">
              <Link to="/voice" className="ai-menu-item">
                <Mic size={16} /> <span>{t("voice_ai")}</span>
              </Link>
              <Link to="/avatar" className="ai-menu-item">
                <UserCircle size={16} /> <span>{t("avatar_ai")}</span>
              </Link>
              <Link to="/chat" className="ai-menu-item">
                <MessageSquare size={16} /> <span>{t("chat_ai")}</span>
              </Link>
            </div>
          </div>

          <Link to="/activities" className={`header-link ${isActive("/activities") ? "active" : ""}`}>
            <span className="header-link-icon mobile-only"><Activity size={18} /></span>
            <span>{t("activities")}</span>
          </Link>

          {user?.role?.toLowerCase() === "admin" && (
            <Link to="/admin" className={`header-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}>
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>{t("admin")}</span>
            </Link>
          )}

          {user?.role?.toLowerCase() === "psychology" && (
            <Link to="/psychology" className={`header-link ${location.pathname.startsWith("/psychology") ? "active" : ""}`}>
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>{t("psychology")}</span>
            </Link>
          )}

          <div className="mobile-only language-switcher-mobile">
            <div className="header-divider"></div>
            <p className="mobile-section-label">{t("language")}</p>
            <div className="lang-btn-group">
              <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>{t("english")}</button>
              <button className={`lang-btn ${language === 'tl' ? 'active' : ''}`} onClick={() => setLanguage('tl')}>{t("tagalog")}</button>
            </div>
          </div>

          {isAuthenticated && (
            <div className="mobile-only mobile-notifications-link">
              <button onClick={toggleNotifications} className="header-link">
                <span className="header-link-icon"><Bell size={18} /></span>
                <span>{t("notifications")}</span>
                {unreadCount > 0 && <span className="mobile-notif-badge">{unreadCount}</span>}
              </button>
            </div>
          )}

          <div className="mobile-only mobile-auth-section">
            <div className="header-divider"></div>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="header-link header-logout-btn">
                <LogOut size={18} />
                <span>{t("logout")}</span>
              </button>
            ) : (
              <Link to="/register" className="header-link get-started-link">{t("get_started")}</Link>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="desktop-only language-switcher-pill">
            <button className={`lang-pill ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            <button className={`lang-pill ${language === 'tl' ? 'active' : ''}`} onClick={() => setLanguage('tl')}>TL</button>
          </div>

          {isAuthenticated ? (
            <>
              <div className="notification-container" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className={`header-link notification-bell desktop-only ${isNotificationOpen ? "active" : ""}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div className="notification-icon-wrapper">
                    <Bell size={20} className="notification-icon" />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </div>
                </button>

                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>{t("notifications")}</h3>
                      <button className="mark-read-btn" onClick={() => {
                        const currentIds = notifications.map(n => n.id);
                        const clearedIds = JSON.parse(localStorage.getItem('clearedNotifications') || '[]');
                        localStorage.setItem('clearedNotifications', JSON.stringify([...new Set([...clearedIds, ...currentIds])]));
                        setNotifications([]);
                        setUnreadCount(0);
                      }}>Clear</button>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">No new alerts</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`notification-item ${n.type}`}>
                            <div className="item-icon">
                              {n.type === 'appointment' ? <Calendar size={16} /> : <Zap size={16} />}
                            </div>
                            <div className="item-content">
                              <p className="item-title">{n.title}</p>
                              <p className="item-msg">{n.message}</p>
                              {n.date && (
                                <div className="item-date">
                                  <Clock size={12} />
                                  <span>{new Date(n.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              )}
                              <span className="item-time">{n.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!location.pathname.startsWith("/admin") && !location.pathname.startsWith("/psychology") && (
                <div className="desktop-profile-dropdown desktop-only">
                  <div className="profile-trigger">
                    <div className="profile-tokens">
                      <span>🪙</span>
                      <span>{user?.tokens ?? 0}</span>
                    </div>
                    <div className="profile-avatar">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="header-profile-img" />
                      ) : (
                        <UserCircle size={24} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">{t("profile")}</Link>
                    <Link to="/feedback" className="dropdown-item">{t("feedback")}</Link>
                    <button onClick={handleLogout} className="dropdown-item text-red">{t("logout")}</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link to="/register" className="header-button-link desktop-only">
              {t("sign_up")}
            </Link>
          )}

          <button className="header-toggle" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {isMenuOpen && <div className="header-backdrop" onClick={toggleMenu}></div>}
    </header>
  );
};

export default Header;