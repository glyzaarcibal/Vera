import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaEnvelopeOpenText } from "react-icons/fa";
import axiosInstance from "../utils/axios.instance";
import "./Auth.css";
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/authSlice";

const EmailVerified = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const [status, setStatus] = useState("input"); // input, verifying, success, error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [isResending, setIsResending] = useState(false);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only numbers

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    // Auto submit if all fields filled
    if (newCode.every(digit => digit !== "") && value) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newCode = [...code];

    pastedData.forEach((char, index) => {
      if (index < 6 && !isNaN(char)) {
        newCode[index] = char;
      }
    });

    setCode(newCode);

    // Focus last filled or next focus
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs[lastIndex].current.focus();

    if (newCode.every(digit => digit !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleVerify = async (otpCode) => {
    const finalCode = otpCode || code.join("");
    if (finalCode.length !== 6) return;

    setStatus("verifying");
    setMessage("Verifying your code...");

    try {
      const response = await axiosInstance.post("/auth/verify-account", { code: finalCode });

      if (response.data.profile) {
        dispatch(setUser(response.data.profile));
      }

      setStatus("success");
      setMessage(response.data.message || "Email verified successfully!");

      setTimeout(() => {
        navigate(response.data.profile?.role === "admin" ? "/admin" : "/");
      }, 2500);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error.response?.data?.message || "Invalid or expired code.");
      // Reset code on error to allow retry
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        setStatus("input");
        if (inputRefs[0].current) inputRefs[0].current.focus();
      }, 2000);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      alert("Email not found. Please try registering again.");
      return;
    }

    setIsResending(true);
    try {
      await axiosInstance.post("/auth/resend-verification", { email });
      alert("A new verification code has been sent to your email.");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-decoration">
        <div className="auth-circle auth-circle-1"></div>
        <div className="auth-circle auth-circle-2"></div>
      </div>

      <div className="auth-card" style={{ maxWidth: "450px", width: "90%" }}>
        {status === "input" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={{ color: "#4CAF50", marginBottom: "20px" }}>
                <FaEnvelopeOpenText size={60} />
              </div>
              <h1 className="auth-title">Verify Your Email</h1>
              <p className="auth-subtitle">
                Enter the 6-digit code we sent to <br />
                <strong>{email || "your email address"}</strong>
              </p>
            </div>

            <div className="otp-input-container" style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "30px" }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="otp-input"
                  style={{
                    width: "50px",
                    height: "60px",
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                    borderRadius: "10px",
                    border: "2px solid #ddd",
                    outline: "none",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify()}
              className="auth-btn"
              disabled={code.some(d => d === "")}
            >
              Verify Code
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p className="auth-footer-text">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  className="auth-link auth-link-bold"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend Code"}
                </button>
              </p>
            </div>
          </>
        )}

        {status === "verifying" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#2196F3" }}>
              <FaSpinner size={60} className="icon-spin" />
            </div>
            <h1 className="auth-title">Verifying...</h1>
            <p className="auth-subtitle">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#4CAF50" }}>
              <FaCheckCircle size={60} />
            </div>
            <h1 className="auth-title">Verified!</h1>
            <p className="auth-subtitle">{message}</p>
            <p className="auth-subtitle" style={{ fontSize: "0.9em", marginTop: "10px" }}>
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", color: "#F44336" }}>
              <FaTimesCircle size={60} />
            </div>
            <h1 className="auth-title">Failed</h1>
            <p className="auth-subtitle" style={{ color: "#F44336" }}>
              {message}
            </p>
          </div>
        )}

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <Link to="/register" className="auth-link">
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;
