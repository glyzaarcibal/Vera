import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../store/slices/authSlice";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <nav className="header-nav">
        <Link to="/" className="header-logo">
          <span className="logo-icon">V</span>
          <span className="logo-text">V.E.R.A.</span>
        </Link>
        <div className="header-links">
          <Link
            to="/"
            className={`header-link ${isActive("/") ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`header-link ${isActive("/about") ? "active" : ""}`}
          >
            About
          </Link>
          <Link
            to="/chat"
            className={`header-link ${isActive("/chat") ? "active" : ""}`}
          >
            Chat AI
          </Link>
          <Link
            to="/voice"
            className={`header-link ${isActive("/voice") ? "active" : ""}`}
          >
            Voice AI
          </Link>
          <Link
            to="/avatar"
            className={`header-link ${isActive("/avatar") ? "active" : ""}`}
          >
            Avatar AI
          </Link>
          {/* Activities Button - Added here */}
          <Link
            to="/activities"
            className={`header-link ${isActive("/activities") ? "active" : ""}`}
          >
            Activities
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`header-link ${isActive("/admin") ? "active" : ""}`}
            >
              Admin
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className={`header-link notification-bell ${isActive("/notifications") ? "active" : ""
                  }`}
              >
                <div className="notification-icon-wrapper">
                  <svg
                    className="notification-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="notification-badge"></span>
                </div>
              </Link>
              <Link
                to="/profile"
                className={`header-link profile-link ${isActive("/profile") ? "active" : ""
                  }`}
              >
                <div className="profile-avatar">
                  {user?.username?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
                <span>{user?.username || user?.email}</span>
              </Link>
              <button onClick={handleLogout} className="header-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="header-button-link">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;