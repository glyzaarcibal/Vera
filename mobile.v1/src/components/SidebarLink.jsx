import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./SidebarLink.css";

const SidebarLink = ({ to, icon, label, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`sidebar-link ${isActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`}
      title={collapsed ? label : ""}
    >
      {icon && <span className="sidebar-link-icon">{icon}</span>}
      {!collapsed && <span className="sidebar-link-label">{label}</span>}
    </Link>
  );
};

export default SidebarLink;
