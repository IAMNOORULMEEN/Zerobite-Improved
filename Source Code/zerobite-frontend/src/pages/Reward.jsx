// src/pages/Reward.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";

export default function Reward() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await authFetch("rewards/");
        if (!res.ok) throw new Error("Failed to load rewards");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="container"><p>Calculating your impact...</p></div>;
  if (error) return <div className="container"><p style={{ color: "red" }}>{error}</p></div>;
  if (!stats) return null;

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <h1 style={{ textAlign: "center", marginBottom: 8 }}>Your Impact Dashboard</h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: 32 }}>
        Every meal you save makes a difference.
      </p>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
        
        {/* Meals Saved */}
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
          <h2 style={{ margin: 0, fontSize: 36, color: "#1a73e8" }}>{stats.meals_saved}</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Meals Saved</p>
        </div>

        {/* Food Weight */}
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
          <h2 style={{ margin: 0, fontSize: 36, color: "#1e8e3e" }}>{stats.kg_saved} kg</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Food Rescued</p>
        </div>

        {/* CO2 Avoided */}
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌍</div>
          <h2 style={{ margin: 0, fontSize: 36, color: "#b06000" }}>{stats.co2_avoided} kg</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>CO₂ Avoided</p>
        </div>
      </div>

      {/* Badge / Tree Section */}
      <div style={{ ...cardStyle, background: "linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%)", padding: 40 }}>
        <h2 style={{ marginTop: 0, textAlign: "center" }}>Your Impact Level</h2>
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          <span style={{ fontSize: 80 }}>{stats.badge.split(" ")[1] || "🌱"}</span>
        </div>
        <h3 style={{ textAlign: "center", margin: 0, color: "#006064" }}>{stats.badge.split(" ")[0]}</h3>
        
        {/* Progress Bar to Next Badge */}
        <div style={{ marginTop: 24, background: "#fff", borderRadius: 10, height: 16, overflow: "hidden", border: "1px solid #ccc" }}>
          <div style={{ 
            height: "100%", 
            background: "#ffb300", 
            width: `${Math.min((stats.meals_saved / 5) * 100, 100)}%`,
            transition: "width 1s ease-in-out"
          }} />
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: 8 }}>
          {stats.meals_saved < 5 
            ? `Rescue ${5 - stats.meals_saved} more meals to reach the next badge!` 
            : "Keep up the amazing work!"}
        </p>
      </div>
    </div>
  );
}

// Simple reusable card style
const cardStyle = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  textAlign: "center",
  border: "1px solid #eaeaea"
};