import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IoArrowBack, IoMail, IoLockClosed } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axiosInstance from "../utils/axios.instance";
import { setUser } from "../store/slices/authSlice";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      const { profile } = res.data;
      dispatch(setUser(profile));
      navigate("/");
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background decoration */}
      <div className="auth-bg-decoration">
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
        <div className="auth-circle auth-circle-3"></div>
      </div>

      <div className="auth-card">
        <button 
          onClick={() => navigate(-1)} 
          className="auth-back-btn"
          aria-label="Go back"
        >
          <IoArrowBack />
          <span>Back</span>
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-text">✨</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              <IoMail className="auth-field-icon" />
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="auth-error-message">{errors.email}</span>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              <IoLockClosed className="auth-field-icon" />
              Password
            </label>
            <div className="auth-input-wrapper auth-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={`auth-input ${errors.password ? "auth-input-error" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <span className="auth-error-message">{errors.password}</span>
            )}
          </div>

          <div className="auth-options">
            <label className="auth-checkbox">
              <input type="checkbox" /> 
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className={`auth-btn ${isLoading ? "auth-btn-loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-spinner"></span>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link auth-link-bold">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;