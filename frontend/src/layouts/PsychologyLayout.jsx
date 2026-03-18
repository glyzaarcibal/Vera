import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu } from "lucide-react";
import PsychologySidebar from "../components/PsychologySidebar";
import "./AdminLayout.css";

const PsychologyLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protected route check
  if (!user || user.role?.toLowerCase() !== "psychology") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-layout">
      <PsychologySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="admin-content">
        <header className="admin-mobile-header">
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
        </header>

        <Outlet />
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
