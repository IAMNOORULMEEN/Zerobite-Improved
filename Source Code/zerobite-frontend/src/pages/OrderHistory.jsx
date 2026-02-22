// src/pages/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      const res = await authFetch("/orders/");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="container">
      <h2>My Confirmed Orders</h2>
      {orders.length === 0 ? (
        <p>No confirmed orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>
              {o.donation_details?.name} — {o.confirmation_note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
