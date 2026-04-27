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
  MdFeedback,
} from "react-icons/md";
import { X } from "lucide-react";
import SidebarLink from "./SidebarLink";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(clearUser());
    if (onClose) onClose();
    navigate("/");
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
          {!collapsed && <span className="sidebar-logo-text">ADMIN</span>}
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
          to="/admin"
          icon={<MdDashboard />}
          label="Dashboard"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/admin/users"
          icon={<MdPeople />}
          label="User Management"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/admin/resources"
          icon={<MdFolder />}
          label="Resources"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/admin/reports"
          icon={<MdBarChart />}
          label="Reports"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/admin/feedback"
          icon={<MdFeedback />}
          label="User Feedback"
          collapsed={collapsed}
        />
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "A"}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.username || user?.email || "Admin"}
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

export default Sidebar;
