import React from "react";
import { motion } from "framer-motion";
import "./About.css";
import arcibalPhoto from "../assets/team/arcibal.jpg";
import cervantesPhoto from "../assets/team/cervantes.jpg";
import mendozaPhoto from "../assets/team/mendoza.png";


const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1 className="about-title">
          About <span className="gradient-text">V.E.R.A.</span>
        </h1>
        <p className="about-subtitle">Voice Emotion Recognition Application</p>
      </div>

      <motion.div 
        className="about-section"
        variants={slideLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
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
          <strong>V.E.R.A. (Voice Emotion Recognition Application)</strong> is an innovative
          AI-driven platform designed to provide a safe, private, and stigma-free environment
          for mental health support. Built specifically for individuals aged <strong>13 and above</strong>,
          V.E.R.A. goes beyond traditional text-based tools by integrating advanced
          <strong> Voice Emotion Recognition</strong>. Our system listens to the nuances in your voice
          to understand your emotional state, providing a more empathetic and accurate
          interaction with our AI Avatar companion.
        </p>
      </motion.div>

      <motion.div 
        className="about-section"
        variants={slideRight}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <h2 className="section-title">Problem Statement</h2>
        <p className="section-text">
          In the Philippines, the population (ages 13 and above) is increasingly facing mental
          health challenges such as anxiety and depression, yet many remain unheard due to
          expensive therapy, social stigma, and the lack of immediate support systems.
          Existing solutions often fail to detect early emotional distress before they
          escalate into crises. V.E.R.A. addresses this by bridging the gap between
          self-awareness and professional intervention, providing an accessible tool that
          identifies risks through voice and behavioral patterns.
        </p>
      </motion.div>

      <motion.div 
        className="about-section"
        variants={slideLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 className="section-title">Our Mission</h2>
        <p className="section-text">
          Our mission is to empower individuals by providing an AI-driven "Mental Health First Aid"
          companion. We aim to foster emotional resilience and awareness among users aged 13 and above
          through technology that listens, understands, and provides immediate support while
          ensuring a path to professional clinical care when necessary.
        </p>
      </motion.div>

      <motion.div 
        className="about-section objectives-section"
        variants={slideRight}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
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
              Utilize <strong>Voice Emotion Recognition</strong> to identify subtle indicators of
              emotional distress and mood shifts in real-time.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">2</div>
            <p className="objective-text">
              Provide 24/7 accessible emotional support through an interactive <strong>AI Avatar</strong>
              capable of empathetic conversation and guidance.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">3</div>
            <p className="objective-text">
              Encourage healthy coping mechanisms through personalized <strong>Mental Health Activities</strong>
              tailored to the user's current emotional state.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">4</div>
            <p className="objective-text">
              Facilitate early detection of high-risk cases and provide a seamless connection
              to licensed mental health professionals via doctor notes and schedules.
            </p>
          </div>
          <div className="objective-item">
            <div className="objective-number">5</div>
            <p className="objective-text">
              Ensure a completely <strong>stigma-free and private</strong> platform where users
              aged 13 and above feel safe to express their true emotions.
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div 
        className="about-section team-section"
        variants={slideLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <div className="section-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h2 className="section-title">The Development Team</h2>
        <div className="team-container">
          <div className="team-group">
            <h3>Developers</h3>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-image-wrapper">
                  <img src={arcibalPhoto} alt="Glyza Marie Parcibal" className="member-image" />
                </div>
                <p className="member-name">Glyza Marie Parcibal</p>
                <p className="member-role">Full Stack Developer</p>
              </div>
              <div className="team-member">
                <div className="member-image-wrapper">
                  <img src={cervantesPhoto} alt="bhea marie cervantes" className="member-image" />
                </div>
                <p className="member-name">Bhea Marie Cervantes</p>
                <p className="member-role">Full Stack Developer</p>
              </div>
              <div className="team-member">
                <div className="member-image-wrapper">
                  <img src={mendozaPhoto} alt="shan norwin mendoza" className="member-image" />

                </div>
                <p className="member-name">Shane Norwin Mendoza</p>
                <p className="member-role">QA Tester</p>
              </div>
            </div>
          </div>

          <div className="team-group centered">
            <h3>Teaching Assistant (TA)</h3>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-image-wrapper">
                  <div className="member-placeholder">👨‍🏫</div>
                </div>
                <p className="member-name">Prof Maria Christina Baloloy</p>
                <p className="member-role">Technical Advisor</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
