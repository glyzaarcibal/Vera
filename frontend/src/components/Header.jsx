import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../store/slices/authSlice";
import { Menu, X, Bell, LogOut, User, LayoutDashboard, Info, MessageSquare, Mic, UserCircle, Activity } from "lucide-react";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    dispatch(clearUser());
    setIsMenuOpen(false);
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open on mobile
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMenuOpen]);

  return (
    <header className={`header ${isMenuOpen ? 'header--menu-open' : ''}`}>
      <nav className="header-nav">
        <Link to="/" className="header-logo">
          <img src="/icon.png" alt="V.E.R.A." className="logo-img" />
          <span className="logo-text">V.E.R.A.</span>
        </Link>

        {/* Hamburger Menu Button */}
        <button
          className="header-toggle"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`header-links ${isMenuOpen ? "show" : ""}`}>
          <Link
            to="/"
            className={`header-link ${isActive("/") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
            <span>Home</span>
          </Link>
          <Link
            to="/about"
            className={`header-link ${isActive("/about") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><Info size={18} /></span>
            <span>About</span>
          </Link>
          <Link
            to="/chat"
            className={`header-link ${isActive("/chat") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><MessageSquare size={18} /></span>
            <span>Chat AI</span>
          </Link>
          <Link
            to="/voice"
            className={`header-link ${isActive("/voice") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><Mic size={18} /></span>
            <span>Voice AI</span>
          </Link>
          <Link
            to="/avatar"
            className={`header-link ${isActive("/avatar") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><UserCircle size={18} /></span>
            <span>Avatar AI</span>
          </Link>
          <Link
            to="/activities"
            className={`header-link ${isActive("/activities") ? "active" : ""}`}
          >
            <span className="header-link-icon mobile-only"><Activity size={18} /></span>
            <span>Activities</span>
          </Link>
          {user?.role?.toLowerCase() === "admin" && (
            <Link
              to="/admin"
              className={`header-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}
            >
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>Admin</span>
            </Link>
          )}
          {user?.role?.toLowerCase() === "psychology" && (
            <Link
              to="/psychology"
              className={`header-link ${location.pathname.startsWith("/psychology") ? "active" : ""}`}
            >
              <span className="header-link-icon mobile-only"><LayoutDashboard size={18} /></span>
              <span>Psychology</span>
            </Link>
          )}

          <div className="header-divider mobile-only"></div>

          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className={`header-link notification-bell ${isActive("/notifications") ? "active" : ""}`}
              >
                <div className="notification-icon-wrapper">
                  <Bell size={20} className="notification-icon" />
                  <span className="notification-badge"></span>
                </div>
                <span className="mobile-only">Notifications</span>
              </Link>
              
              {/* Desktop Profile Dropdown */}
              <div className="desktop-profile-dropdown">
                <div className="profile-trigger">
                  <div className="profile-avatar">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="header-profile-img" />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <span>{user?.username || user?.email}</span>
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  <button onClick={handleLogout} className="dropdown-item text-red">Logout</button>
                </div>
              </div>

              {/* Mobile Profile & Logout */}
              <Link
                to="/profile"
                className={`header-link profile-link mobile-only-flex ${isActive("/profile") ? "active" : ""}`}
              >
                <div className="profile-avatar">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="header-profile-img" />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <span>{user?.username || user?.email}</span>
              </Link>
              <button onClick={handleLogout} className="header-button header-logout-mobile mobile-only-flex">
                <LogOut size={18} className="mobile-only" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="header-button-link">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && <div className="header-backdrop" onClick={toggleMenu}></div>}
    </header>
  );
};

export default Header;