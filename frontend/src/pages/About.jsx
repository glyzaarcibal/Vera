import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1 className="about-title">
          About <span className="gradient-text">V.E.R.A.</span>
        </h1>
        <p className="about-subtitle">Voice Emotion Recognition Application</p>
      </div>

      <div className="about-section">
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <h2 className="section-title">Introduction</h2>
        <p className="section-text">
          V.E.R.A. (Voice Emotion Recognition Application) is a mobile application designed
          to support the mental well-being of young individuals using AI-driven tools. The
          app integrates voice emotion recognition, predictive analytics, an AI avatar chatbot,
          and emotional tracking to help users become more aware of their mental state and
          access immediate support. As youth mental health problems continue to rise, many
          individuals lack access to timely and stigma-free assistance. V.E.R.A. aims to
          bridge this gap by providing an engaging, user-friendly, and technology-driven
          platform that encourages early intervention, continuous support, and emotional awareness.
        </p>
      </div>

      <div className="about-section">
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h2 className="section-title">Problem Statement</h2>
        <p className="section-text">
          Youth mental health challenges, including emotional distress and self-destructive
          behavior, remain a serious issue in the Philippines. Many young people struggle to
          access mental health services due to stigma, limited resources, and lack of professional
          support. Traditional mental health programs often fail to offer early detection and
          continuous engagement, making at-risk youth more vulnerable to crises. There is a need
          for an accessible mobile solution that integrates predictive analytics, AI chatbot
          support, and emotional monitoring to help identify risks early and provide timely assistance.
        </p>
      </div>

      <div className="about-section">
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 className="section-title">Our Mission</h2>
        <p className="section-text">
          To evaluate the effectiveness of V.E.R.A., a mobile app that uses predictive analytics,
          voice emotion recognition, and AI chatbot support, in providing mental health first aid
          and improving emotional well-being among young individuals at risk.
        </p>
      </div>

      <div className="about-section objectives-section">
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>
        <h2 className="section-title">Our Objectives</h2>
        <div className="objectives-list">
          <div className="objective-item">
            <div className="objective-number">1</div>
            <p className="objective-text">
              Analyze how the app's predictive analytics and emotion recognition system help
              identify early signs of emotional distress and self-destructive ideation.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">2</div>
            <p className="objective-text">
              Evaluate the ability of the AI chatbot to provide immediate emotional support
              and mental health first aid.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">3</div>
            <p className="objective-text">
              Determine whether the app's features (mood tracking, voice input, avatar interaction)
              improve user engagement with mental health resources.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">4</div>
            <p className="objective-text">
              Assess users' overall experience in terms of accessibility, usability, and perceived
              usefulness in supporting mental wellness.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">5</div>
            <p className="objective-text">
              Examine how the app contributes to reducing mental health risks over time through
              continuous monitoring and personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
