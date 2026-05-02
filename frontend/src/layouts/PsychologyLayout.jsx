import React, { useState } from "react";
import { Navigate, useLocation, useOutlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu } from "lucide-react";
import PsychologySidebar from "../components/PsychologySidebar";
import { AnimatePresence, motion } from "framer-motion";
import "./AdminLayout.css";

const PsychologyLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();

  // Protected route check
  if (!user || user.role?.toLowerCase() !== "psychology") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <PsychologySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="admin-content" style={{ position: "relative" }}>
        <header className="admin-mobile-header">
          <div className="mobile-header-left">
            <button
              className="admin-sidebar-toggle"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="admin-mobile-logo">
              <span className="logo-icon">V</span>
              <span className="logo-text">PSYCHOLOGY</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, filter: "blur(6px)", scale: 0.98, y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
            exit={{ opacity: 0, filter: "blur(6px)", scale: 1.02, y: -10 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.35 }}
            style={{ width: "100%", minHeight: "100%" }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default PsychologyLayout;
