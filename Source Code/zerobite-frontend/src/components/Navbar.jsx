// src/components/Navbar.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import LoginModal from "./LoginModal";
import Avatar from "./Avatar";
import "../styles/_navbar.scss";

const Navbar = ({ onProfileClick }) => {
  const { user } = useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);

  const scrollTo = (id) => {
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
        <h1 className="brand">ZeroBite</h1>

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
            <div
              className="profile-section"
              onClick={onProfileClick}
              role="button"
              tabIndex={0}
            >
              <Avatar avatarName={user.avatar} size={34} className="navbar-avatar" />
              <p className="profile-username">{user.username}</p>
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
