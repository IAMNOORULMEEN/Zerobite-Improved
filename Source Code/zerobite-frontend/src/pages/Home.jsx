// src/pages/Home.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/_home.scss";
import Sections from "../components/Sections";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const { user } = useContext(AuthContext); // assumes AuthContext provides user
  const navigate = useNavigate();

  const handleDonateClick = () => {
    if (user) {
      // logged in -> go to Donate page
      navigate("/donate");
    } else {
      // logged out -> go to Login/Register page
      // If you use a modal instead of a page, replace this with the modal trigger.
      navigate("/login");
      // Example for modal (if you implement modal state): setShowAuthModal(true);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          {/* 🔹 Brand on top */}
          <h2 className="hero-brand">ZeroBite</h2>

          {/* Quote below */}
          <h1>“Give a Bite. Change a Life.”</h1>
          <p>
            At <strong>ZeroBite</strong>, we believe no food should go to waste.
            Together, we connect restaurants, NGOs, and volunteers to make every
            meal count.
          </p>

          <div className="cta-row">
            {/* Donate Now button replaces the input */}
            <button className="donate-btn" onClick={handleDonateClick}>
              DONATE NOW
            </button>
          </div>
        </div>
      </section>

      {/* Scrollable Sections */}
      <Sections />
    </>
  );
};

export default Home;