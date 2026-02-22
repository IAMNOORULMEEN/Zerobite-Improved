// src/components/Sections.jsx
import React, { useEffect, useRef } from "react";
import foodImg from "../assets/food-donor.jpg";
import platformImg from "../assets/platform.jpg";
import volunteersImg from "../assets/volunteers.jpg";
import "../styles/_sections.scss";

const AboutCard = ({ img, title, children, reverse = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // add when enters viewport
            el.classList.add("in-view");
          } else {
            // remove when leaves so animation can replay on re-entry
            el.classList.remove("in-view");
          }
        });
      },
      { threshold: 0.18 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={`about-block ${reverse ? "reverse" : ""}`}>
      <div ref={ref} className="about-card">
        <div className="about-img-wrap">
          <img
            src={img}
            alt={title}
            onError={(e) => {
              // fallback: hide broken image and show color block
              e.target.style.display = "none";
              const p = e.target.parentNode;
              if (p) p.classList.add("img-fallback");
            }}
          />
        </div>

        <div className="text">
          <h3>{title}</h3>
          <p>{children}</p>
        </div>
      </div>
    </div>
  );
};

const Sections = () => {
  return (
    <>
      <section id="about" className="section about">
        <h2>About Us</h2>
        <p className="tagline">
          ZeroBite connects donors, NGOs and volunteers — turning surplus food
          into meals for people in need.
        </p>

        <AboutCard img={foodImg} title="Food Donors">
          Restaurants, events and households list surplus food quickly and
          safely — helping reduce waste and feed communities.
        </AboutCard>

        <AboutCard img={platformImg} title="ZeroBite Platform" reverse>
          Smart matching routes donations to nearby NGOs & volunteers in
          real-time. Pickup details, ETA and quantity make logistics efficient.
        </AboutCard>

        <AboutCard img={volunteersImg} title="NGOs & Volunteers">
          Volunteers and NGOs receive requests, confirm pickup and deliver food
          to shelters and communities — fast and traceable.
        </AboutCard>
      </section>

      <section id="donate" className="section donate">
        <h2>Donate</h2>
        <div className="section-content">
          <p className="quote">
            “Sharing food is more than giving a meal — it’s giving hope, dignity, and love.”
          </p>
          <p className="highlight">
            Every act of kindness counts. By donating surplus food, you’re not just reducing waste — 
            you’re fueling change, one plate at a time.
          </p>
        </div>
      </section>

      <section id="contact" className="section contact">
        <h2>Contact Us</h2>
        <div className="section-content">
          <p className="quote">
            “Together, we can build a community where no one sleeps hungry.”
          </p>
          <p className="highlight">
            Whether you’re a restaurant, volunteer, NGO, or supporter — we’d love to hear from you.  
            Let’s make Zero Hunger a reality.
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:support@zerobite.org">support@zerobite.org</a></li>
            <li><strong>Phone:</strong> +91 98765 43210</li>
          </ul>
        </div>
      </section>
    </>
  );
};

export default Sections;
