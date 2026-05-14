import React, { useState, useRef } from "react";
import { Star, Upload, Send, MessageSquare, AlertCircle, CheckCircle2, X } from "lucide-react";
import axiosInstance from "../utils/axios.instance";
import { useNavigate } from "react-router-dom";
import "./Feedback.css";

const Feedback = () => {
  const [type, setType] = useState("feedback"); // 'feedback' or 'report'
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("type", type);
    formData.append("rating", rating);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    try {
      await axiosInstance.post("/feedback/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowSuccess(true);
      // Reset form
      setType("feedback");
      setRating(0);
      setDescription("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        
        {/* Glass Header */}
        <div className="feedback-header">
          <div className="feedback-icon-wrapper">
             {type === 'feedback' ? <MessageSquare size={32} className="text-primary" /> : <AlertCircle size={32} className="text-secondary" />}
          </div>
          <div className="header-text">
            <h1 className="title">
              {type === 'feedback' ? 'Help Us Improve' : 'Report an Issue'}
            </h1>
            <p className="subtitle">
              {type === 'feedback' 
                ? 'Tell us what you love or what we can do better.' 
                : 'Encountered a bug? Providing details helps us fix it faster.'}
            </p>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="feedback-tabs">
          <button 
            type="button"
            onClick={() => setType('feedback')}
            className={`tab-btn ${type === 'feedback' ? 'active' : ''}`}
          >
            Feedback
          </button>
          <button 
            type="button"
            onClick={() => setType('report')}
            className={`tab-btn ${type === 'report' ? 'active' : ''}`}
          >
            Report Issue
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          
          {/* Rating Section */}
          {type === 'feedback' && (
            <div className="form-group">
              <label className="label">Rate your experience</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className={`star-btn ${(hoveredRating || rating) >= star ? 'filled' : ''}`}
                  >
                    <Star 
                      size={32} 
                      fill={(hoveredRating || rating) >= star ? "currentColor" : "none"} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Area */}
          <div className="form-group">
            <label className="label">
              {type === 'feedback' ? 'Your Feedback' : 'Description of the problem'}
            </label>
            <div className="input-wrapper">
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'feedback' ? 'Write your thoughts here...' : 'Explain what happened...'}
              />
            </div>
          </div>

          {/* Upload Box */}
          <div className="form-group">
            <label className="label">Upload Screenshot (Optional)</label>
            <div className="upload-zone">
              {!imagePreview ? (
                <div 
                  className="upload-trigger" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="upload-icon" />
                  <p className="upload-text">Click to upload image</p>
                  <span className="upload-hint">PNG, JPG up to 5MB</span>
                </div>
              ) : (
                <div className="preview-container">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="remove-img-btn"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden-input" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="submit-btn"
          >
            {isSubmitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Submit {type === 'feedback' ? 'Feedback' : 'Report'}</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="feedback-modal-overlay">
          <div className="success-card">
            <div className="success-icon-bg">
              <CheckCircle2 size={48} className="text-emerald" />
            </div>
            <h2>Thank You!</h2>
            <p>Your message has been sent successfully. We appreciate your input!</p>
            <button 
              onClick={() => {
                setShowSuccess(false);
                navigate("/");
              }}
              className="home-btn"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
