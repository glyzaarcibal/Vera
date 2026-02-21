import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack, IoPerson, IoMail, IoCalendar, IoLockClosed, IoCall } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axiosInstance from "../utils/axios.instance";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contactNumber: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    // Username validation
    if (!formData.username) {
      newErrors.username = "Name is required";
    } else if (formData.username.length < 2) {
      newErrors.username = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Contact number validation
    if (!formData.contactNumber) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid contact number";
    }

    // Birth date validation
    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.birthDate = "You must be at least 13 years old";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
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
      const res = await axiosInstance.post("/auth/register", formData);
      console.log(res);
      navigate("/check-email");
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container auth-landscape">
      {/* Background decoration */}
      <div className="auth-bg-decoration">
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
        <div className="auth-circle auth-circle-3"></div>
      </div>

      <div className="auth-card auth-card-landscape">
        <button 
          onClick={() => navigate(-1)} 
          className="auth-back-btn"
          aria-label="Go back"
        >
          <IoArrowBack />
          <span>Back</span>
        </button>

        <div className="auth-landscape-container">
          {/* Left side - Branding/Illustration */}
          <div className="auth-landscape-brand">
            <div className="auth-landscape-content">
              <div className="auth-logo-large">
                <span className="auth-logo-text">✨</span>
              </div>
              <h1 className="auth-landscape-title">Join Us Today!</h1>
              <p className="auth-landscape-subtitle">
                Create your account and start your journey with us. 
                Fill in your details to get started.
              </p>
              <div className="auth-landscape-features">
                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <span>Secure Authentication</span>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <span>24/7 Support</span>
                </div>
                <div className="auth-feature">
                  <span className="auth-feature-icon">✓</span>
                  <span>Free Account</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Registration Form */}
          <div className="auth-landscape-form">
            <div className="auth-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">Sign up to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form auth-form-grid">
              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="username">
                    <IoPerson className="auth-field-icon" />
                    Full Name
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Enter your full name"
                      value={formData.username}
                      onChange={handleChange}
                      className={`auth-input ${errors.username ? "auth-input-error" : ""}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && (
                    <span className="auth-error-message">{errors.username}</span>
                  )}
                </div>

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
              </div>

              <div className="auth-form-row">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="contactNumber">
                    <IoCall className="auth-field-icon" />
                    Contact Number
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="Enter your contact number"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={`auth-input ${errors.contactNumber ? "auth-input-error" : ""}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.contactNumber && (
                    <span className="auth-error-message">{errors.contactNumber}</span>
                  )}
                  <span className="auth-hint">Format: +1234567890</span>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="birthDate">
                    <IoCalendar className="auth-field-icon" />
                    Birth Date
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={`auth-input ${errors.birthDate ? "auth-input-error" : ""}`}
                      disabled={isLoading}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  {errors.birthDate && (
                    <span className="auth-error-message">{errors.birthDate}</span>
                  )}
                </div>
              </div>

              <div className="auth-form-row">
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
                      placeholder="Create a password"
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

                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirmPassword">
                    <IoLockClosed className="auth-field-icon" />
                    Confirm Password
                  </label>
                  <div className="auth-input-wrapper auth-password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`auth-input ${errors.confirmPassword ? "auth-input-error" : ""}`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="auth-error-message">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              <div className="auth-password-hint">
                <span className="auth-hint">
                  Password must be at least 8 characters with uppercase, lowercase, and number
                </span>
              </div>

              <div className="auth-terms">
                <label className="auth-checkbox">
                  <input type="checkbox" required /> 
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="auth-link">Terms of Service</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="auth-link">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                className={`auth-btn ${isLoading ? "auth-btn-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="auth-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="auth-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-link auth-link-bold">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;