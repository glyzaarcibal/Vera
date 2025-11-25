import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      const { profile } = res.data;
      dispatch(setUser(profile));
      navigate("/");
    } catch (e) {
      alert(e.response.data.message || "Internal Server Error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={() => navigate(-1)} className="auth-back-btn">
          <IoArrowBack />
          <span>Back</span>
        </button>

        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-link-right">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="auth-btn">
            Sign in
          </button>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
