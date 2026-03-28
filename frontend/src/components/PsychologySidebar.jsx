import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../store/slices/authSlice";
import {
  MdDashboard,
  MdPeople,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdHome,
  MdFolder,
  MdBarChart,
} from "react-icons/md";
import { X } from "lucide-react";
import SidebarLink from "./SidebarLink";
import "./Sidebar.css";

const PsychologySidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(clearUser());
    if (onClose) onClose();
    navigate("/login");
  };

  // Close sidebar when clicking links on mobile
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">V</span>
          {!collapsed && <span className="sidebar-logo-text">PSYCHOLOGY</span>}
        </div>

        {/* Toggle for desktop / Close for mobile */}
        <button
          className="sidebar-close-mobile"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <SidebarLink
          to="/"
          icon={<MdHome />}
          label="Back to Home"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/psychology"
          icon={<MdDashboard />}
          label="Dashboard"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/psychology/users"
          icon={<MdPeople />}
          label="User Management"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/psychology/resources"
          icon={<MdFolder />}
          label="Resources"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/psychology/reports"
          icon={<MdBarChart />}
          label="Analytics"
          collapsed={collapsed}
        />
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "P"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.username || user?.email || "Psychology"}
              </div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>
                {user?.role || "Staff"}
              </div>
            </div>
          </div>
        )}
        <button
          className={`sidebar-logout ${collapsed ? "collapsed" : ""}`}
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
        >
          <span className="sidebar-logout-icon">
            <MdLogout />
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default PsychologySidebar;
