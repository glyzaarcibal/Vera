import React, { useState, useEffect } from "react";
import { MessageSquare, AlertCircle, Star, Calendar, User, ExternalLink, CheckCircle, Clock } from "lucide-react";
import axiosInstance from "../../utils/axios.instance";
import "./FeedbackManagement.css";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'feedback', 'report'

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/feedback/all", {
        params: { type: filter === "all" ? undefined : filter }
      });
      setFeedbacks(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-feedback-page">
      <div className="admin-feedback-header">
        <div className="header-info">
          <h1 className="title">User Insights & Reports</h1>
          <p className="subtitle">Real-time analysis of user satisfaction and technical health.</p>
        </div>
        
        {/* Dynamic Counter Tags */}
        <div className="header-badges">
          <div className="badge badge-indigo">
             <MessageSquare size={14} />
             <span>{feedbacks.filter(f => f.type === 'feedback').length} Feedbacks</span>
          </div>
          <div className="badge badge-rose">
             <AlertCircle size={14} />
             <span>{feedbacks.filter(f => f.type === 'report').length} Reports</span>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-glass">
          <div className="stat-icon stats-indigo"><MessageSquare /></div>
          <div className="stat-content">
            <span className="stat-val">{feedbacks.filter(f => f.type === 'feedback').length}</span>
            <span className="stat-lbl">Community Feedback</span>
          </div>
        </div>
        <div className="admin-stat-glass">
          <div className="stat-icon stats-rose"><AlertCircle /></div>
          <div className="stat-content">
            <span className="stat-val">{feedbacks.filter(f => f.type === 'report').length}</span>
            <span className="stat-lbl">Active Reports</span>
          </div>
        </div>
        <div className="admin-stat-glass">
          <div className="stat-icon stats-gold"><Star /></div>
          <div className="stat-content">
            <span className="stat-val">
              {feedbacks.length > 0 
                ? (feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length || 0).toFixed(1) 
                : "0.0"}
            </span>
            <span className="stat-lbl">System Rating</span>
          </div>
        </div>
      </div>

      {/* Filter Control */}
      <div className="admin-filter-bar">
        <div className="filter-pill">
          {['all', 'feedback', 'report'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="feedback-list-container">
        {loading ? (
          <div className="loader-frame">
            <div className="custom-loader"></div>
            <p>Syncing global feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon"><MessageSquare size={50} /></div>
            <h3>No data in this category</h3>
            <p>Wait for users to share their experiences or report issues.</p>
          </div>
        ) : (
          <div className="feedback-grid">
            {feedbacks.map((f, idx) => (
              <div 
                key={f.id} 
                className="feedback-item-card"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="card-top">
                   <div className={`type-tag ${f.type === 'report' ? 'tag-rose' : 'tag-indigo'}`}>
                      {f.type}
                   </div>
                   <div className="card-date">
                      <Calendar size={12} />
                      {new Date(f.created_at).toLocaleDateString()}
                   </div>
                </div>

                <div className="card-main">
                  {f.rating && (
                    <div className="rating-stars mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < f.rating ? "#f59e0b" : "none"} 
                          className={i >= f.rating ? "text-slate-200" : "text-gold"} 
                        />
                      ))}
                    </div>
                  )}
                  
                  <p className="description">{f.description}</p>

                  {f.image_url && (
                    <div className="image-attachment">
                      <img src={f.image_url} alt="User attachment" />
                      <a href={f.image_url} target="_blank" rel="noreferrer" className="img-overlay">
                        <ExternalLink size={20} />
                        <span>View Attachment</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="card-bottom">
                  <div className="user-info">
                    <div className="user-avatar-mini">
                      <User size={14} />
                    </div>
                    <span className="user-id">USER_{f.user_id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  
                  <div className="action-set">
                     <button className="action-btn resolve" title="Mark as Resolved"><CheckCircle size={18} /></button>
                     <button className="action-btn pending" title="Mark Pending"><Clock size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
