import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { IoArrowBack, IoPerson, IoMail, IoCalendar, IoLockClosed, IoCall } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axiosInstance from "../utils/axios.instance";
import { setUser } from "../store/slices/authSlice";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contactNumber: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
    guardianName: "",
    guardianContact: "",
    guardianEmail: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [requiresConsent, setRequiresConsent] = useState(false);
  const [consentStep, setConsentStep] = useState(1); // 1: form, 2: verification sent, 3: verified
  const [consentAgreed, setConsentAgreed] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Check if consent is required when birth date changes
    if (e.target.name === 'birthDate') {
      const birthDate = new Date(e.target.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      setRequiresConsent(actualAge < 19 && actualAge >= 13);
    }
    
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
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 13) {
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

    // Parental consent validation (if required)
    if (requiresConsent) {
      if (!formData.guardianName) {
        newErrors.guardianName = "Guardian name is required";
      }
      
      if (!formData.guardianContact && !formData.guardianEmail) {
        newErrors.guardianContact = "Either guardian contact number or email is required";
        newErrors.guardianEmail = "Either guardian contact number or email is required";
      } else {
        if (formData.guardianContact && !/^\+?[\d\s-]{10,}$/.test(formData.guardianContact)) {
          newErrors.guardianContact = "Please enter a valid guardian contact number";
        }
        if (formData.guardianEmail && !/\S+@\S+\.\S+/.test(formData.guardianEmail)) {
          newErrors.guardianEmail = "Please enter a valid guardian email";
        }
      }
      
      if (!consentAgreed) {
        newErrors.consent = "Parental consent is required for users under 18";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if parental consent is required and verified
    if (requiresConsent && consentStep !== 3) {
      alert("Please complete parental consent verification before registering.");
      return;
    }

    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/register", formData);

      // If profile is returned, it means auto-login or already verified
      if (res.data.profile) {
        dispatch(setUser(res.data.profile));
        navigate(res.data.profile?.role === "admin" ? "/admin" : "/");
      } else {
        // Redirect to verification page for code entry
        navigate("/email-verified", { state: { email: formData.email } });
      }
    } catch (e) {
      alert(e.response?.data?.message || "Internal Server Error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendGuardianVerification = async () => {
    setIsLoading(true);
    try {
      // Send verification to guardian
      await axiosInstance.post("/auth/send-guardian-verification", {
        guardianName: formData.guardianName,
        guardianContact: formData.guardianContact,
        guardianEmail: formData.guardianEmail,
        childName: formData.username,
        childEmail: formData.email,
      });
      setConsentStep(2); // Move to verification sent step
    } catch (e) {
      alert(e.response?.data?.message || "Failed to send verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyConsent = async (verificationCode) => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/verify-guardian-consent", {
        verificationCode,
        childEmail: formData.email,
      });
      setConsentStep(3); // Move to verified step
    } catch (e) {
      alert(e.response?.data?.message || "Verification failed");
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
              <h1 className="auth-landscape-title">Create Your <span className="auth-highlight">Account Today!</span></h1>
              <p className="auth-landscape-subtitle">
                Start your wellness journey with personalized mental health support. Sign up in minutes.
              </p>
              <div className="auth-landscape-features">
                <div className="auth-feature">
                  <h1 className="auth-landscape-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    Analyze Your <span style={{ color: '#fbbf24' }}>Emotions Today!</span>
                  </h1>
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
              <h2 className="auth-title" style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.25rem' }}>Voice Analysis Profile</h2>
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

              {requiresConsent && (
                <div className="auth-consent-section">
                  <div className="auth-consent-header">
                    <h3 className="auth-consent-title">Parental/Guardian Consent Required</h3>
                    <p className="auth-consent-subtitle">
                      Since you are under 18, we need parental consent to create your account.
                    </p>
                  </div>

                  {consentStep === 1 && (
                    <div className="auth-consent-form">
                      <div className="auth-form-row">
                        <div className="auth-field">
                          <label className="auth-label" htmlFor="guardianName">
                            <IoPerson className="auth-field-icon" />
                            Parent/Guardian Name
                          </label>
                          <div className="auth-input-wrapper">
                            <input
                              type="text"
                              id="guardianName"
                              name="guardianName"
                              placeholder="Enter guardian's full name"
                              value={formData.guardianName}
                              onChange={handleChange}
                              className={`auth-input ${errors.guardianName ? "auth-input-error" : ""}`}
                              disabled={isLoading}
                            />
                          </div>
                          {errors.guardianName && (
                            <span className="auth-error-message">{errors.guardianName}</span>
                          )}
                        </div>

                        <div className="auth-field">
                          <label className="auth-label" htmlFor="guardianContact">
                            <IoCall className="auth-field-icon" />
                            Guardian Contact Number
                          </label>
                          <div className="auth-input-wrapper">
                            <input
                              type="tel"
                              id="guardianContact"
                              name="guardianContact"
                              placeholder="Guardian's phone number"
                              value={formData.guardianContact}
                              onChange={handleChange}
                              className={`auth-input ${errors.guardianContact ? "auth-input-error" : ""}`}
                              disabled={isLoading}
                            />
                          </div>
                          {errors.guardianContact && (
                            <span className="auth-error-message">{errors.guardianContact}</span>
                          )}
                        </div>
                      </div>

                      <div className="auth-form-row">
                        <div className="auth-field auth-field-full">
                          <label className="auth-label" htmlFor="guardianEmail">
                            <IoMail className="auth-field-icon" />
                            Guardian Email (Optional if contact number provided)
                          </label>
                          <div className="auth-input-wrapper">
                            <input
                              type="email"
                              id="guardianEmail"
                              name="guardianEmail"
                              placeholder="Guardian's email address"
                              value={formData.guardianEmail}
                              onChange={handleChange}
                              className={`auth-input ${errors.guardianEmail ? "auth-input-error" : ""}`}
                              disabled={isLoading}
                            />
                          </div>
                          {errors.guardianEmail && (
                            <span className="auth-error-message">{errors.guardianEmail}</span>
                          )}
                        </div>
                      </div>

                      <div className="auth-consent-checkbox">
                        <label className="auth-checkbox">
                          <input
                            type="checkbox"
                            checked={consentAgreed}
                            onChange={(e) => setConsentAgreed(e.target.checked)}
                          />
                          <span>
                            I understand that parental consent is required and I will provide accurate guardian information.
                          </span>
                        </label>
                        {errors.consent && (
                          <span className="auth-error-message">{errors.consent}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`auth-btn auth-btn-secondary ${isLoading ? "auth-btn-loading" : ""}`}
                        onClick={handleSendGuardianVerification}
                        disabled={isLoading || !consentAgreed}
                      >
                        {isLoading ? (
                          <>
                            <span className="auth-spinner"></span>
                            Sending verification...
                          </>
                        ) : (
                          "Send Verification to Guardian"
                        )}
                      </button>
                    </div>
                  )}

                  {consentStep === 2 && (
                    <div className="auth-consent-verification">
                      <div className="auth-consent-status">
                        <div className="auth-consent-icon">📧</div>
                        <h4>Verification Sent</h4>
                        <p>
                          We've sent a verification code to {formData.guardianContact || formData.guardianEmail}.
                          Please ask your guardian to check their {formData.guardianContact ? 'messages' : 'email'} and enter the code below.
                        </p>
                      </div>
                      
                      <GuardianVerificationForm 
                        onVerify={handleVerifyConsent}
                        isLoading={isLoading}
                      />
                      
                      <button
                        type="button"
                        className="auth-btn auth-btn-secondary"
                        onClick={() => setConsentStep(1)}
                        disabled={isLoading}
                      >
                        Change Guardian Details
                      </button>
                    </div>
                  )}

                  {consentStep === 3 && (
                    <div className="auth-consent-approved">
                      <div className="auth-consent-status">
                        <div className="auth-consent-icon">✅</div>
                        <h4>Consent Approved</h4>
                        <p>
                          Your guardian has approved your account creation. You can now complete your registration.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

const GuardianVerificationForm = ({ onVerify, isLoading }) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }
    onVerify(verificationCode.trim());
  };

  return (
    <div className="auth-verification-form">
      <div className="auth-field">
        <label className="auth-label" htmlFor="verificationCode">
          Verification Code
        </label>
        <div className="auth-input-wrapper">
          <input
            type="text"
            id="verificationCode"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value);
              if (error) setError("");
            }}
            className={`auth-input ${error ? "auth-input-error" : ""}`}
            disabled={isLoading}
            maxLength={6}
          />
        </div>
        {error && <span className="auth-error-message">{error}</span>}
      </div>
      
      <button
        type="button"
        className={`auth-btn ${isLoading ? "auth-btn-loading" : ""}`}
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="auth-spinner"></span>
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </button>
    </div>
  );
};

export default Register;
