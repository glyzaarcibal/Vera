import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import axiosInstance from "../utils/axios.instance";
import "./Auth.css";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/authSlice";

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const effectRan = useRef(false);

  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (effectRan.current) return; // Prevent double execution in strict mode

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyAccount = async () => {
      effectRan.current = true;
      try {
        const response = await axiosInstance.post("/auth/verify-account", { token });

        // Store user in Redux (Automatic pasok)
        if (response.data.profile) {
          dispatch(setUser(response.data.profile));
        }

        setStatus("success");

        // Optionally redirect to home after a delay
        setTimeout(() => {
          navigate("/"); // or your home page
        }, 3000);
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed. The link may be invalid or expired.");
      }
    };

    verifyAccount();
  }, [token, dispatch, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>

        {status === "verifying" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#2196F3" }}>
              <FaSpinner size={60} className="icon-spin" />
            </div>
            <h1 className="auth-title">Verifying...</h1>
            <p className="auth-subtitle">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#4CAF50" }}>
              <FaCheckCircle size={60} />
            </div>
            <h1 className="auth-title">Email Verified!</h1>
            <p className="auth-subtitle">
              Your email has been successfully verified. You are being redirected...
            </p>
            <div style={{ marginTop: "30px" }}>
              <Link to="/welcome" className="auth-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                Continue to Home
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#F44336" }}>
              <FaTimesCircle size={60} />
            </div>
            <h1 className="auth-title">Verification Failed</h1>
            <p className="auth-subtitle" style={{ color: "#F44336" }}>
              {message}
            </p>
            <div style={{ marginTop: "30px" }}>
              <Link to="/register" className="auth-link">
                Back to Registration
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default EmailVerified;
