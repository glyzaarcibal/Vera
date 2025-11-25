import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../utils/axios.instance";
import "./Auth.css";

const UpdatePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (!token) {
      alert("Invalid or missing reset token");
      return;
    }

    try {
      const res = await axiosInstance.post("/auth/reset-password", {
        token,
        password: formData.password,
      });
      console.log(res);
      alert("Password updated successfully!");
      navigate("/login");
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Update password</h1>
          <p className="auth-subtitle">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <button type="submit" className="auth-btn">
            Update password
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
