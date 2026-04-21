import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Legal.css";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: February 28, 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We may collect information you provide directly, including:</p>
          <ul>
            <li>Name, email address, contact number, and date of birth.</li>
            <li>Account and profile details.</li>
            <li>Messages, activity data, and support requests.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>Your information is used to:</p>
          <ul>
            <li>Create and manage your account.</li>
            <li>Provide, maintain, and improve Vera features.</li>
            <li>Send service and security-related communications.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share data with trusted
            service providers who support hosting, analytics, and operational
            services, subject to confidentiality and security requirements.
          </p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We implement reasonable technical and organizational safeguards to
            protect your information. No system is completely secure, but we
            continuously work to reduce risks.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We keep personal data only as long as needed for service delivery,
            compliance, dispute resolution, and legitimate business purposes.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or restrict use of your personal data. You may also request
            a copy of your information.
          </p>
        </section>

        <section>
          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Vera is not intended for children under 13. If we learn we
            collected personal information from a child under 13, we will take
            steps to remove it.
          </p>
        </section>

        <section>
          <h2>8. Policy Updates</h2>
          <p>
            We may update this Privacy Policy as services or laws change. We
            will post the latest version on this page.
          </p>
        </section>

        <p className="legal-back-link">
          <Link to="#" onClick={(e) => { e.preventDefault(); navigate(-1); }}>Go Back</Link>
        </p>
      </div>
    </div>
  );
};

export default Privacy;
