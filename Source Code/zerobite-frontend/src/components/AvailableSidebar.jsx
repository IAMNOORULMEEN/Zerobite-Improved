import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/_availableside.scss";

const AvailableSidebar = ({ isOpen, onClose }) => {
  const { getAccess, refreshAccess } = useContext(AuthContext);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

  const fetchDonations = async () => {
    setLoading(true);
    setError("");
    try {
      let token = getAccess ? getAccess() : localStorage.getItem("access");

      let res = await fetch(`${apiUrl}/food/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401 && typeof refreshAccess === "function") {
        const ok = await refreshAccess();
        if (ok) {
          token = getAccess ? getAccess() : localStorage.getItem("access");
          res = await fetch(`${apiUrl}/food/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }

      const data = await res.json();
      setDonations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("AvailableSidebar fetch error:", err);
      setError(err.message || "Failed to fetch donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchDonations();
  }, [isOpen]);

  return (
    <div className={`available-side ${isOpen ? "visible" : "hidden"}`}>
      <button className="close-btn" onClick={onClose}>✖</button>
      <h2 className="side-title">Available Food</h2>

      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && donations.length === 0 && <p className="status">No donations available.</p>}

      <div className="donation-list">
        {donations.map(item => (
          <div className="donation-card" key={item.id}>
            <div className="donation-header">
              <img src={item.donor_avatar ? `/assets/avatars/${item.donor_avatar}` : "/assets/avatars/avatar1.png"} alt="avatar" className="donor-avatar" />
              <span className="donor-name">{item.donor_username}</span>
            </div>
            <h3>{item.name}</h3>
            <p>Qty: {item.quantity}</p>
            <p>Location: {item.location}</p>
            {item.expiry_time && <p className="expiry">Expires: {new Date(item.expiry_time).toLocaleString()}</p>}
            <p className="desc">{item.description || "No description"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableSidebar;