import React from "react";
import { Link } from "react-router-dom";
import "./Legal.css";

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: February 28, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using Vera, you agree to these Terms of Service. If you do not
            agree, please stop using the service.
          </p>
        </section>

        <section>
          <h2>2. Eligibility and Youth Usage</h2>
          <p>
            Vera is designed for users of all ages, including teenagers and youth. 
            <strong> By registering and checking the agreement box during sign-up, you explicitly confirm that:</strong>
          </p>
          <ul>
            <li>You are at least 13 years old.</li>
            <li>If you are under 18 (a minor), you have obtained full permission from your parent or legal guardian to use this service.</li>
            <li>Checking the agreement box constitutes binding evidence that parental consent has been granted for youth usage.</li>
          </ul>
        </section>

        <section>
          <h2>3. Your Account</h2>
          <p>
            You are responsible for keeping your login details secure and for
            all activity under your account. Notify us immediately if you
            suspect unauthorized access.
          </p>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Break any law or regulation.</li>
            <li>Attempt to gain unauthorized access to systems or data.</li>
            <li>Interfere with platform security or availability.</li>
            <li>Upload harmful, abusive, or malicious content.</li>
          </ul>
        </section>

        <section>
          <h2>5. Health Disclaimer</h2>
          <p>
            Vera may provide wellness-related support and information, but it
            is not a substitute for professional medical, psychological, or
            emergency services. If you are in crisis, contact local emergency
            services immediately.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            All platform content, branding, and software are owned by or
            licensed to Vera and protected by applicable laws. You may not
            copy, distribute, or reverse engineer the service except where
            legally allowed.
          </p>
        </section>

        <section>
          <h2>7. Termination</h2>
          <p>
            We may suspend or terminate accounts that violate these Terms or
            create risk to users or the platform.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Vera is not liable for
            indirect, incidental, or consequential damages resulting from your
            use of the service.
          </p>
        </section>

        <section>
          <h2>9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of Vera
            after updates means you accept the revised Terms.
          </p>
        </section>

        <p className="legal-back-link">
          <Link to="/register">Back to Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Terms;
