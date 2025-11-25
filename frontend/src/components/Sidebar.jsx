import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/md";
import SidebarLink from "./SidebarLink";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">V</span>
          {!collapsed && <span className="sidebar-logo-text">ADMIN</span>}
        </div>
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
              <div className="sidebar-user-role">Administrator</div>
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
