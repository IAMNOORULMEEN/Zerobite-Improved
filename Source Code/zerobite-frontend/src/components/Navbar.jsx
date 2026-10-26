// src/components/Navbar.jsx
import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoginModal from "./LoginModal";
import Avatar from "./Avatar";
import authFetch from "../utils/authFetch";
import "../styles/_navbar.scss";

const Navbar = ({ onProfileClick }) => {
  const { user } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch unread notification count when user changes
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnread() {
      try {
        const res = await authFetch("notifications/");
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }
    
    fetchUnread();
    // Optional: Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const scrollTo = (id) => {
    // If not on home page, go to home page first
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }
    
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" }); // fallback
    }
  };

  return (
    <>
      <nav className="navbar pill-navbar">
        {/* Brand on left */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 className="brand">ZeroBite</h1>
        </Link>

        {/* Transparent pill nav links */}
        <div className="nav-container">
          <ul className="nav-links">
            <li>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("about");
                }}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#donate"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("donate");
                }}
              >
                Donate
              </a>
            </li>
            <li>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("contact");
                }}
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Right side: login or user profile */}
          {!user ? (
            <button className="login-btn" onClick={() => setModalOpen(true)}>
              Login / Register
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              
              {/* Notification Bell */}
              <div 
                onClick={() => navigate("/notifications")}
                style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {/* Simple SVG Bell */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {/* Red Badge for Unread */}
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#ff4d4f', color: 'white', borderRadius: '50%',
                    padding: '2px 6px', fontSize: '11px', fontWeight: 'bold',
                    minWidth: '18px', textAlign: 'center', lineHeight: '1.2'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Profile Section */}
              <div
                className="profile-section"
                onClick={onProfileClick}
                role="button"
                tabIndex={0}
              >
                <Avatar avatarName={user.avatar} size={34} className="navbar-avatar" />
                <p className="profile-username">{user.username}</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Login/Register Modal */}
      <LoginModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        afterLoginRedirect="/"
      />
    </>
  );
};

export default Navbar;