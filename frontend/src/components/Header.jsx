import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../store/slices/authSlice";
import "./Header.css";
import { selectUser } from "../store/slices/authSelectors";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  console.log(user);
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
                to="/profile"
                className={`header-link profile-link ${
                  isActive("/profile") ? "active" : ""
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
