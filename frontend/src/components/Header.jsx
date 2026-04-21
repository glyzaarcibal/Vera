import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Menu, X, Bell, LogOut, User, Activity, LayoutDashboard, Sparkles, ChevronDown, Mic, MessageSquare, UserCircle } from "lucide-react";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSelectors";
import { clearUser } from "../store/slices/authSlice";
import logoImg from "../assets/logo.png";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/");
  };

  return (
    <header className="header">
      <nav className="header-nav">
        {/* LEFT: Logo */}
        <div className="header-left">
          <Link to="/" className="header-logo">
            <img src={logoImg} alt="V.E.R.A. Logo" className="logo-img" />
          </Link>
        </div>

        {/* CENTER: Navigation (Desktop) */}
        <div className={`header-center ${isMenuOpen ? "open" : ""}`}>
          <Link to="/" className={`header-link ${isActive("/") ? "active" : ""}`}>
             <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
             <span>Home</span>
          </Link>

          {/* AI DROPDOWN */}
          <div className="desktop-ai-dropdown">
            <div className="header-link dropdown-trigger">
              <span className="header-link-icon mobile-only"><Sparkles size={18} /></span>
              <span>AI Features</span>
              <ChevronDown size={14} className="dropdown-arrow-icon" />
            </div>
            <div className="desktop-ai-menu">
              <Link to="/voice" className="ai-menu-item">
                <Mic size={16} /> <span>Voice AI</span>
              </Link>
              <Link to="/avatar" className="ai-menu-item">
                <UserCircle size={16} /> <span>Avatar AI</span>
              </Link>
              <Link to="/chat" className="ai-menu-item">
                <MessageSquare size={16} /> <span>Chat AI</span>
              </Link>
            </div>
          </div>

          <Link to="/activities" className={`header-link ${isActive("/activities") ? "active" : ""}`}>
            <span className="header-link-icon mobile-only"><Activity size={18} /></span>
            <span>Activities</span>
          </Link>

          {user?.role?.toLowerCase() === "admin" && (
            <Link to="/admin" className={`header-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}>
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>Admin</span>
            </Link>
          )}

          {user?.role?.toLowerCase() === "psychology" && (
            <Link to="/psychology" className={`header-link ${location.pathname.startsWith("/psychology") ? "active" : ""}`}>
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>Psychology</span>
            </Link>
          )}

          <div className="mobile-only">
             <div className="header-divider"></div>
             {isAuthenticated ? (
               <button onClick={handleLogout} className="header-link text-red">
                 <LogOut size={18} />
                 <span>Logout</span>
               </button>
             ) : (
                <Link to="/register" className="header-link color-primary" style={{ fontWeight: 'bold' }}>Get Started</Link>
             )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="header-right">
          {isAuthenticated ? (
            <>
              <Link to="/notifications" className={`header-link notification-bell desktop-only ${isActive("/notifications") ? "active" : ""}`}>
                <div className="notification-icon-wrapper">
                  <Bell size={20} className="notification-icon" />
                  <span className="notification-badge"></span>
                </div>
              </Link>
              
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
                      user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  <Link to="/feedback" className="dropdown-item">Feedback & Support</Link>
                  <button onClick={handleLogout} className="dropdown-item text-red">Logout</button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/register" className="header-button-link desktop-only">
              Get Started
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