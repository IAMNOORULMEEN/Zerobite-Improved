// src/pages/DonationHistory.jsx
import React, { useEffect, useState, useCallback } from "react";
import authFetch from "../utils/authFetch";

export default function DonationHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await authFetch("http://127.0.0.1:8000/api/orders/", { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed loading orders", e);
      setErr(e.message || "Failed loading orders");
    } finally { 
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const onOrderPlaced = () => loadOrders();
    window.addEventListener("zerobite_order_placed", onOrderPlaced);
    return () => window.removeEventListener("zerobite_order_placed", onOrderPlaced);
  }, [loadOrders]);

  if (loading) return <div className="container"><p>Loading your confirmed orders...</p></div>;
  if (err) return <div className="container"><p style={{ color: "red" }}>{err}</p></div>;
  if (!orders.length) return <div className="container"><p>No confirmed orders yet.</p></div>;

  return (
    <div className="container">
      <h1>Donation History</h1>
      <button onClick={loadOrders} style={{ marginBottom: 12 }}>Refresh</button>
      <ul className="list">
        {orders.map((o) => {
          const donation = o.donation_details || o.donation || {};
          const title = donation.name || donation.title || `Donation #${o.donation || "?"}`;
          return (
            <li key={o.id} className="card" style={{ marginBottom: 12, padding: 12 }}>
              <strong>{title}</strong>
              <p>{o.confirmation_note}</p>
              <small style={{ color: "#666" }}>
                📍 {o.latitude != null ? Number(o.latitude).toFixed(3) : "—"}, {o.longitude != null ? Number(o.longitude).toFixed(3) : "—"} <br />
                ⏰ {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}
              </small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
