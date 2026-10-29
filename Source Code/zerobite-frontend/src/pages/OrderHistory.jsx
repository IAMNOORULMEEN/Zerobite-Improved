// src/pages/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      const res = await authFetch("orders/");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    }
    loadOrders();
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("📋 Code copied to clipboard!");
  };

  return (
    <div className="container">
      <h2>My Confirmed Orders</h2>
      {orders.length === 0 ? (
        <p>No confirmed orders yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.map((o) => (
            <li key={o.id} style={{ marginBottom: 24, padding: 20, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{o.donation_details?.name}</h3>
                  <p style={{ margin: 0, color: '#666' }}>{o.confirmation_note}</p>
                </div>
                {o.status === "picked_up" ? (
                  <span style={{ background: '#e6f4ea', color: '#1e8e3e', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}>
                    ✅ Picked Up
                  </span>
                ) : (
                  <span style={{ background: '#fef7e0', color: '#b06000', padding: '6px 12px', borderRadius: 8, fontWeight: 700 }}>
                    ⏳ Awaiting Pickup
                  </span>
                )}
              </div>

              {o.status === "picked_up" ? (
                <p style={{ marginTop: 16, fontSize: 14, color: '#1e8e3e', fontWeight: 600 }}>
                  Verified on {o.code_verified_at ? new Date(o.code_verified_at).toLocaleString() : "—"}
                </p>
              ) : o.pickup_code ? (
                <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px dashed #ccc' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#333' }}>Show this code to the donor at pickup:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <code
                      style={{
                        fontSize: 36,
                        letterSpacing: 8,
                        fontWeight: 700,
                        background: "#fff",
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: '2px solid #ffb300',
                        fontFamily: "monospace",
                        color: '#333'
                      }}
                    >
                      {o.pickup_code}
                    </code>
                    <button 
                      onClick={() => copyCode(o.pickup_code)}
                      style={{ padding: '10px 16px', background: '#ffb300', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', color: '#000' }}
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#999", fontStyle: 'italic', marginTop: 16 }}>Code will be generated shortly.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}