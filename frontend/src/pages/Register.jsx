import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  IoArrowBack,
  IoPerson,
  IoMail,
  IoCalendar,
  IoLockClosed,
  IoCall,
  IoCheckmarkCircle,
  IoShieldCheckmark,
} from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../utils/axios.instance";
import { setUser } from "../store/slices/authSlice";
import ReusableModal from "../components/ReusableModal";
import "./Register.css";

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
  const [consentStep, setConsentStep] = useState(1);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [errorModal, setErrorModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "error" 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "birthDate") {
      const birthDate = new Date(e.target.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;
      setRequiresConsent(actualAge < 19 && actualAge >= 13);
    }
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Name is required";
    else if (formData.username.length < 2) newErrors.username = "At least 2 characters";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact number required";
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.contactNumber))
      newErrors.contactNumber = "Invalid contact number";
    if (!formData.birthDate) newErrors.birthDate = "Birth date is required";
    else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      if (actualAge < 13) newErrors.birthDate = "Must be at least 13 years old";
    }
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "At least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Need uppercase, lowercase & number";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords don't match";
    if (requiresConsent) {
      if (!formData.guardianEmail) {
        newErrors.guardianEmail = "Guardian email required";
      } else if (!/\S+@\S+\.\S+/.test(formData.guardianEmail)) {
        newErrors.guardianEmail = "Invalid email format";
      }
      if (!consentAgreed) newErrors.consent = "Parental consent is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (requiresConsent && consentStep !== 3) {
      setErrorModal({
        isOpen: true,
        title: "Consent Required",
        message: "Please complete parental consent verification before moving forward.",
        type: "confirm"
      });
      return;
    }
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/register", formData);
      if (res.data.profile) {
        dispatch(setUser(res.data.profile));
        navigate(res.data.profile?.role === "admin" ? "/admin" : "/");
      } else {
        navigate("/email-verified", { state: { email: formData.email } });
      }
    } catch (e) {
      setErrorModal({
        isOpen: true,
        title: "Registration Failed",
        message: e.response?.data?.message || "Internal Server Error",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendGuardianVerification = async () => {
    if (!formData.guardianEmail) {
      setErrors({ ...errors, guardianEmail: "Guardian email is required" });
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/send-guardian-verification", {
        guardianName: formData.guardianName,
        guardianContact: formData.guardianContact,
        guardianEmail: formData.guardianEmail,
        childName: formData.username,
        childEmail: formData.email,
      });
      setConsentStep(2);
    } catch (e) {
      setErrorModal({
        isOpen: true,
        title: "Verification Error",
        message: e.response?.data?.message || "Failed to send verification",
        type: "error"
      });
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
      setConsentStep(3);
    } catch (e) {
      setErrorModal({
        isOpen: true,
        title: "Invalid Code",
        message: e.response?.data?.message || "Verification failed",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reg-shell">
      <div className="reg-blob reg-blob-1" />
      <div className="reg-blob reg-blob-2" />
      <div className="reg-blob reg-blob-3" />

      <motion.div 
        className="reg-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* ── LEFT: Branding Panel (Now consistently on the left) ── */}
        <div className="reg-panel-brand">
          <button className="reg-back-btn" onClick={() => navigate("/")}>
            <IoArrowBack />
            <span>Back</span>
          </button>

          <div className="reg-brand">
            <div className="reg-brand-icon">
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="30" fill="rgba(255,255,255,0.1)" />
                <path d="M14 30 Q20 18 26 30 Q32 42 38 30 Q44 18 50 30"
                  stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="30" cy="30" r="4" fill="white" />
              </svg>
            </div>
            <h1 className="reg-brand-title">
              Join <span className="reg-brand-accent">Vera</span>
            </h1>
            <p className="reg-brand-subtitle">
              Your AI-powered mental wellness companion. Start tracking your emotional journey today.
            </p>
          </div>

          <div className="reg-features">
            {[
              { icon: "🎙️", label: "Voice Emotion Analysis" },
              { icon: "📊", label: "Mood & Wellness Tracking" },
              { icon: "🔒", label: "Private & Secure" },
            ].map((f, i) => (
              <div className="reg-feature-chip" key={i}>
                <span className="reg-feature-emoji">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div className="reg-panel-form">
          <div className="reg-form-header">
            <h2 className="reg-form-title">Create Account</h2>
            <p className="reg-form-subtitle">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="reg-form" noValidate>
            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label" htmlFor="username">
                  <IoPerson className="reg-label-icon" /> Full Name
                </label>
                <div className="reg-input-wrap">
                  <input type="text" id="username" name="username" placeholder="Your full name"
                    value={formData.username} onChange={handleChange} disabled={isLoading}
                    className={`reg-input ${errors.username ? "reg-input-err" : ""}`} />
                </div>
                {errors.username && <span className="reg-err">{errors.username}</span>}
              </div>
              <div className="reg-field">
                <label className="reg-label" htmlFor="email">
                  <IoMail className="reg-label-icon" /> Email Address
                </label>
                <div className="reg-input-wrap">
                  <input type="email" id="email" name="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleChange} disabled={isLoading}
                    className={`reg-input ${errors.email ? "reg-input-err" : ""}`} />
                </div>
                {errors.email && <span className="reg-err">{errors.email}</span>}
              </div>
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label" htmlFor="contactNumber">
                  <IoCall className="reg-label-icon" /> Contact Number
                </label>
                <div className="reg-input-wrap">
                  <input type="tel" id="contactNumber" name="contactNumber" placeholder="+63 912 345 6789"
                    value={formData.contactNumber} onChange={handleChange} disabled={isLoading}
                    className={`reg-input ${errors.contactNumber ? "reg-input-err" : ""}`} />
                </div>
                {errors.contactNumber && <span className="reg-err">{errors.contactNumber}</span>}
              </div>
              <div className="reg-field">
                <label className="reg-label" htmlFor="birthDate">
                  <IoCalendar className="reg-label-icon" /> Birth Date
                </label>
                <div className="reg-input-wrap">
                  <input type="date" id="birthDate" name="birthDate"
                    value={formData.birthDate} onChange={handleChange} disabled={isLoading}
                    max={new Date().toISOString().split("T")[0]}
                    className={`reg-input ${errors.birthDate ? "reg-input-err" : ""}`} />
                </div>
                {errors.birthDate && <span className="reg-err">{errors.birthDate}</span>}
              </div>
            </div>

            <div className="reg-row">
              <div className="reg-field">
                <label className="reg-label" htmlFor="password">
                  <IoLockClosed className="reg-label-icon" /> Password
                </label>
                <div className="reg-input-wrap reg-pw-wrap">
                  <input type={showPassword ? "text" : "password"} id="password" name="password"
                    placeholder="Create password" value={formData.password} onChange={handleChange}
                    disabled={isLoading} className={`reg-input ${errors.password ? "reg-input-err" : ""}`} />
                  <button type="button" className="reg-pw-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <span className="reg-err">{errors.password}</span>}
              </div>
              <div className="reg-field">
                <label className="reg-label" htmlFor="confirmPassword">
                  <IoLockClosed className="reg-label-icon" /> Confirm Password
                </label>
                <div className="reg-input-wrap reg-pw-wrap">
                  <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword"
                    placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange}
                    disabled={isLoading} className={`reg-input ${errors.confirmPassword ? "reg-input-err" : ""}`} />
                  <button type="button" className="reg-pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password">
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="reg-err">{errors.confirmPassword}</span>}
              </div>
            </div>

            <p className="reg-pw-hint">Use 8+ characters with uppercase, lowercase & a number</p>

            {requiresConsent && (
              <div className="reg-consent-box">
                <div className="reg-consent-head">
                  <IoShieldCheckmark className="reg-consent-icon" />
                  <div>
                    <h3 className="reg-consent-title">Parental Consent Required</h3>
                    <p className="reg-consent-sub">Since you're under 19, we need parental/guardian approval.</p>
                  </div>
                </div>
                {consentStep === 1 && (
                  <div className="reg-consent-form">
                    <div className="reg-row">
                      <div className="reg-field">
                        <label className="reg-label" htmlFor="guardianName"><IoPerson className="reg-label-icon" /> Guardian Name</label>
                        <div className="reg-input-wrap">
                          <input type="text" id="guardianName" name="guardianName" placeholder="Guardian's full name"
                            value={formData.guardianName} onChange={handleChange} disabled={isLoading}
                            className={`reg-input ${errors.guardianName ? "reg-input-err" : ""}`} />
                        </div>
                        {errors.guardianName && <span className="reg-err">{errors.guardianName}</span>}
                      </div>
                      <div className="reg-field">
                        <label className="reg-label" htmlFor="guardianContact"><IoCall className="reg-label-icon" /> Guardian Contact <span className="reg-optional">(optional)</span></label>
                        <div className="reg-input-wrap">
                          <input type="tel" id="guardianContact" name="guardianContact" placeholder="Guardian's phone"
                            value={formData.guardianContact} onChange={handleChange} disabled={isLoading}
                            className={`reg-input ${errors.guardianContact ? "reg-input-err" : ""}`} />
                        </div>
                        {errors.guardianContact && <span className="reg-err">{errors.guardianContact}</span>}
                      </div>
                    </div>
                    <div className="reg-field">
                      <label className="reg-label" htmlFor="guardianEmail"><IoMail className="reg-label-icon" /> Guardian Email</label>
                      <div className="reg-input-wrap">
                        <input type="email" id="guardianEmail" name="guardianEmail" placeholder="Guardian's email"
                          value={formData.guardianEmail} onChange={handleChange} disabled={isLoading}
                          className={`reg-input ${errors.guardianEmail ? "reg-input-err" : ""}`} />
                      </div>
                      {errors.guardianEmail && <span className="reg-err">{errors.guardianEmail}</span>}
                    </div>
                    <label className="reg-checkbox-row">
                      <input type="checkbox" checked={consentAgreed} onChange={(e) => setConsentAgreed(e.target.checked)} />
                      <span>I confirm that I will provide accurate guardian information for consent.</span>
                    </label>
                    {errors.consent && <span className="reg-err">{errors.consent}</span>}
                    <button type="button" className="reg-consent-btn" onClick={handleSendGuardianVerification} disabled={isLoading || !consentAgreed}>
                      {isLoading ? <><span className="reg-spinner" /> Sending…</> : "Send Verification to Guardian"}
                    </button>
                  </div>
                )}
                {consentStep === 2 && (
                  <div className="reg-consent-status">
                    <div className="reg-status-icon">📧</div>
                    <h4>Verification Sent</h4>
                    <p>A code was sent to your guardian's email: <strong>{formData.guardianEmail}</strong>. Ask your guardian to enter it below.</p>
                    <GuardianVerificationForm onVerify={handleVerifyConsent} isLoading={isLoading} />
                    <button type="button" className="reg-text-btn" onClick={() => setConsentStep(1)}>← Change Guardian Details</button>
                  </div>
                )}
                {consentStep === 3 && (
                  <div className="reg-consent-status reg-consent-approved">
                    <div className="reg-status-icon">✅</div>
                    <h4>Consent Approved!</h4>
                    <p>Your guardian has approved. You can now complete registration.</p>
                  </div>
                )}
              </div>
            )}

            <label className="reg-checkbox-row reg-terms">
              <input type="checkbox" required id="terms" />
              <span>
                I agree to the <Link to="/terms" className="reg-link">Terms of Service</Link> (including Youth Usage permission) 
                and <Link to="/privacy" className="reg-link">Privacy Policy</Link>. 
                <span className="reg-evidence-note">Checking this serves as binding evidence of consent for youth usage.</span>
              </span>
            </label>

            <button type="submit" id="register-submit" className={`reg-submit ${isLoading ? "reg-submit-loading" : ""}`} disabled={isLoading}>
              {isLoading ? <><span className="reg-spinner" /> Creating account…</> : <><IoCheckmarkCircle /> Create Account</>}
            </button>

            <p className="reg-signin-link">
              Already have an account? <Link to="/login" className="reg-link reg-link-bold">Sign in</Link>
            </p>
          </form>
        </div>

      </motion.div>

      <ReusableModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        type={errorModal.type}
      />
    </div>
  );
};

const GuardianVerificationForm = ({ onVerify, isLoading }) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = () => {
    if (!verificationCode.trim()) { setError("Please enter the verification code"); return; }
    onVerify(verificationCode.trim());
  };
  return (
    <div className="reg-verify-form">
      <div className="reg-field">
        <label className="reg-label" htmlFor="verificationCode">Verification Code</label>
        <div className="reg-input-wrap">
          <input type="text" id="verificationCode" placeholder="Enter 6-digit code"
            value={verificationCode} onChange={(e) => { setVerificationCode(e.target.value); if (error) setError(""); }}
            className={`reg-input ${error ? "reg-input-err" : ""}`} disabled={isLoading} maxLength={6} />
        </div>
        {error && <span className="reg-err">{error}</span>}
      </div>
      <button type="button" className="reg-submit" onClick={handleSubmit} disabled={isLoading} style={{ marginTop: "0.75rem" }}>
        {isLoading ? <><span className="reg-spinner" /> Verifying…</> : "Verify Code"}
      </button>
    </div>
  );
};

export default Register;