import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IoArrowBack, IoMail, IoLockClosed } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axiosInstance from "../utils/axios.instance";
import { setUser } from "../store/slices/authSlice";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "At least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      dispatch(setUser(res.data.profile));
      navigate("/");
    } catch (e) {
      const message = e.response?.data?.message || "Internal Server Error";
      if (e.response?.status === 403 && (message.includes("verify") || message.includes("confirm"))) {
        navigate("/email-verified", { state: { email: formData.email } });
      } else {
        alert(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="log-shell">
      {/* Animated blobs */}
      <div className="log-blob log-blob-1" />
      <div className="log-blob log-blob-2" />
      <div className="log-blob log-blob-3" />

      <div className="log-card">

        {/* ── LEFT: Branding Panel ── */}
        <div className="log-panel-brand">
          <button className="log-back-btn" onClick={() => navigate("/")}>
            <IoArrowBack />
            <span>Back</span>
          </button>

          <div className="log-brand">
            <div className="log-brand-icon">
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.1)" />
                <path d="M14 30 Q20 18 26 30 Q32 42 38 30 Q44 18 50 30"
                  stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="30" cy="30" r="4" fill="white" />
              </svg>
            </div>
            <h1 className="log-brand-title">
              Welcome to <span className="log-brand-accent">Vera</span>
            </h1>
            <p className="log-brand-subtitle">
              Your AI-powered mental wellness companion. Sign in to continue your emotional journey.
            </p>
          </div>

          <div className="log-features">
            {[
              { icon: "🎙️", label: "Voice Emotion Analysis" },
              { icon: "📊", label: "Mood & Wellness Tracking" },
              { icon: "🔒", label: "Private & Secure" },
            ].map((f, i) => (
              <div className="log-feature-chip" key={i}>
                <span className="log-feature-emoji">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          <div className="log-panel-footer">
            Don't have an account?{" "}
            <Link to="/register" className="log-panel-link">Sign Up</Link>
          </div>
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div className="log-panel-form">
          <div className="log-form-header">
            <h2 className="log-form-title">Sign In</h2>
            <p className="log-form-subtitle">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="log-form" noValidate>
            {/* Email */}
            <div className="log-field">
              <label className="log-label" htmlFor="email">
                <IoMail className="log-label-icon" />
                Email Address
              </label>
              <div className="log-input-wrap">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`log-input ${errors.email ? "log-input-err" : ""}`}
                />
              </div>
              {errors.email && <span className="log-err">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="log-field">
              <label className="log-label" htmlFor="password">
                <IoLockClosed className="log-label-icon" />
                Password
              </label>
              <div className="log-input-wrap log-pw-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`log-input ${errors.password ? "log-input-err" : ""}`}
                />
                <button
                  type="button"
                  className="log-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="log-err">{errors.password}</span>}
            </div>

            {/* Options row */}
            <div className="log-options">
              <label className="log-checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="log-link">Forgot password?</Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              className={`log-submit ${isLoading ? "log-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="log-spinner" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="log-signup-link">
              Don't have an account?{" "}
              <Link to="/register" className="log-link log-link-bold">Sign up</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;
