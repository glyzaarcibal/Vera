import React, { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axios.instance";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      console.log(res);
      setIsSubmitted(true);
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">
            {isSubmitted
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-btn">
              Send reset link
            </button>

            <p className="auth-footer-text">
              Remember your password?{" "}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <div className="auth-success-card">
            <div className="auth-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="auth-success-text">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login" style={{ width: '100%' }}>
              <button className="auth-btn" style={{ width: '100%' }}>
                Back to login
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
