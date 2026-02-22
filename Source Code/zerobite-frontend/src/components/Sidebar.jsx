// src/components/Sidebar.jsx
import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProfileSidebar from "./ProfileSidebar";
import {
  UserCog,
  MessageSquare,
  LogOut,
  MapPin,
  Bell,
  Gift,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import "../styles/_sidebar.scss";

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useContext(AuthContext);
  const [showProfile, setShowProfile] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setShowProfile(false);
    onClose && onClose();
  };

  const avatarSrc = user?.avatar || "/assets/avatars/avatar1.png";
  const username = user?.username || "Guest";
  const initials = username
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const unreadCount = user?.unreadNotifications || 0;

  // menu definitions
  const menuItems = [
    { to: "/", label: "Dashboard", Icon: ClipboardList },
    { to: "/my-offers", label: "My Offers", Icon: Gift },
    { to: "/donations", label: "Donation History", Icon: MapPin },
    { to: "/nearby-requests", label: "Nearby Requests", Icon: MapPin },
    { to: "/notifications", label: "Notifications", Icon: Bell, badge: unreadCount },
    { to: "/edit-profile", label: "Edit Profile", Icon: UserCog },
    { to: "/feedback", label: "Feedback", Icon: MessageSquare },
    { to: "/help", label: "Help & Support", Icon: HelpCircle },
  ];

  return (
    <div className={`sidebar ${isOpen ? "visible" : "hidden"}`} aria-hidden={!isOpen}>
      {/* Header with avatar */}
      <div
        className="sidebar-header"
        style={{
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="avatar-btn"
            onClick={() => setShowProfile(true)}
            aria-label="Open profile"
            title="View profile"
          >
            {!imgError ? (
              <img
                src={avatarSrc}
                alt={`${username} avatar`}
                onError={() => setImgError(true)}
                className="sidebar-avatar"
              />
            ) : (
              <div className="avatar-fallback" aria-hidden="true">
                {initials}
              </div>
            )}
          </button>

          <div className="sidebar-user">
            <div className="sidebar-username">{username}</div>
            <div className="sidebar-role">{user?.role || ""}</div>
          </div>
        </div>

        <button className="close-btn" onClick={handleClose} aria-label="Close sidebar">
          ✖
        </button>
      </div>

      {/* Menu / profile toggle */}
      <div style={{ padding: 12 }}>
        {showProfile ? (
          <ProfileSidebar onClose={handleClose} />
        ) : (
          <>
            <ul className="sidebar-menu" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {menuItems.map(({ to, label, Icon, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={() => handleClose()}
                  >
                    <Icon size={18} style={{ marginRight: 8 }} />
                    <span>{label}</span>
                    {badge ? (
                      <span className="badge" aria-label={`${badge} unread`}>
                        {badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Logout */}
            <div className="logout-wrapper">
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  handleClose();
                  navigate("/"); // optional: send to home after logout
                }}
                aria-label="Logout"
              >
                <LogOut size={16} /> <span style={{ marginLeft: 6 }}>Logout</span>
              </button>
            </div>

            <div className="sidebar-foot" aria-hidden="true">
              ZeroBite — reducing waste, feeding communities
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
