import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineMail } from "react-icons/hi";
import "./Auth.css"; // Reusing auth styles for consistency

const CheckEmail = () => {
    return (
        <div className="auth-container">
            <div className="auth-card" style={{ textAlign: "center" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "20px",
                    color: "#4CAF50"
                }}>
                    <HiOutlineMail size={60} />
                </div>

                <h1 className="auth-title">Check your email</h1>
                <p className="auth-subtitle">
                    We've sent a verification link to your email address.
                    Please check your inbox (and spam folder) to activate your account.
                </p>

                <div style={{ marginTop: "30px" }}>
                    <p className="auth-footer-text">
                        Verified?{" "}
                        <Link to="/" className="auth-link">
                            Sign in
                        </Link>
                    </p>
                </div>

                <div style={{ marginTop: "20px" }}>
                    <Link to="/" className="auth-link" style={{ fontSize: "0.9rem" }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;
