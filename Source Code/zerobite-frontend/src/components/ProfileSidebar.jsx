// src/components/ProfileSidebar.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";
import { useNavigate } from "react-router-dom";

export default function ProfileSidebar({ onClose }) {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await authFetch("/api/donations/user_stats/");
      if (!mounted) return;
      if (!res.ok) {
        setStats(null); return;
      }
      const data = await res.json();
      setStats(data);
    }
    load();
    return () => mounted = false;
  }, []);

  if (!stats) return <div className="profile-sidebar">Loading…</div>;

  return (
    <div className="profile-sidebar">
      <button onClick={onClose}>✕</button>
      <h3>Your donations</h3>
      <div>Posted: {stats.posted_count}</div>
      <div>Claimed: {stats.claimed_count}</div>
      <div>Expired: {stats.expired_count}</div>
      <h4>Recent</h4>
      {stats.posts.slice(0,6).map(p => (
        <div key={p.id} style={{padding:"8px 0", borderBottom:"1px dashed #eee"}} onClick={() => { navigate("/available"); onClose && onClose(); }}>
          <div>{p.name} ×{p.quantity}</div>
          <div style={{fontSize:12, color:"#666"}}>{p.is_expired ? "Expired" : (p.is_claimed ? "Claimed" : "Available")}</div>
        </div>
      ))}
    </div>
  );
}
