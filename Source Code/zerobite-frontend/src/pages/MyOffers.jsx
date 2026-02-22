// src/components/MyOffers.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const MyOffers = () => {
  const { user, token } = useContext(AuthContext); // or read token from localStorage
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOffers = async () => {
      setLoading(true);
      try {
        // Prefer server-side filtered endpoint if available:
        // const res = await axios.get("/api/my-offers", { headers: { Authorization: `Bearer ${token}` }});

        // Quick client-side approach (prototype):
        const res = await axios.get("/api/offers", { headers: { Authorization: `Bearer ${token}` }});
        const all = res.data || [];
        const mine = all.filter((o) => {
          // adjust key names to match your API
          return o.owner_id === user.id || o.owner === user.id || o.user_id === user.id;
        });
        setOffers(mine);
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [user, token]);

  if (!user) return <p>Please log in to view your offers.</p>;
  if (loading) return <p>Loading...</p>;
  if (!offers.length) return <p>No offers yet — create your first offer!</p>;

  return (
    <div>
      <h2>My Offers</h2>
      <ul>
        {offers.map((o) => (
          <li key={o.id}>
            <strong>{o.title || o.item || "Offer"}</strong>
            <div>{o.quantity ? `${o.quantity}` : ""} • {o.pickup_time || o.created_at}</div>
            <div>{o.address || o.location || ""}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyOffers;
