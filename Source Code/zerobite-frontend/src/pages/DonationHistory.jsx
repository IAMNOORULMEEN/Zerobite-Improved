// src/pages/DonationHistory.jsx
import React, { useEffect, useState, useCallback } from "react";
import authFetch from "../utils/authFetch";
import ConfirmPickupModal from "../components/ConfirmPickupModal";

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [pickupOrderId, setPickupOrderId] = useState(null);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // Fetch the donor's own posted donations
      const res = await authFetch("donations/user_stats/", { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // The API returns { posts: [...] }
      setDonations(data.posts || []);
    } catch (e) {
      console.error("Failed loading donations", e);
      setErr(e.message || "Failed loading donations");
    } finally { 
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  if (loading) return <div className="container"><p>Loading your donations...</p></div>;
  if (err) return <div className="container"><p style={{ color: "red" }}>{err}</p></div>;
  if (!donations.length) return <div className="container"><p>You haven't posted any donations yet.</p></div>;

  return (
    <div className="container">
      <h1>My Posted Donations</h1>
      <button onClick={loadDonations} style={{ marginBottom: 12, padding: '8px 16px', cursor: 'pointer' }}>
        Refresh
      </button>
      <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
        {donations.map((d) => (
          <li key={d.id} className="card" style={{ marginBottom: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
            <strong style={{ fontSize: 18 }}>{d.name}</strong>
            <p style={{ margin: '8px 0', color: '#555' }}>{d.description}</p>
            <small style={{ color: "#888", display: 'block', marginBottom: 12 }}>
              📍 {d.location} <br />
              ⏰ Expires: {d.expiry_time ? new Date(d.expiry_time).toLocaleString() : "—"}
            </small>

            {d.is_expired ? (
              <div style={{ background: '#fce8e6', color: '#c5221f', padding: '10px', borderRadius: 6, fontWeight: 700, fontSize: 14 }}>
                ❌ Expired
              </div>
            ) : d.is_claimed ? (
              <div>
                <div style={{ background: '#e6f4ea', color: '#1e8e3e', padding: '10px', borderRadius: 6, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  ✅ Claimed by {d.claimed_by_username || "an NGO"}
                </div>
                {d.order_id && (
                  <button
                    onClick={() => setPickupOrderId(d.order_id)}
                    style={{
                      padding: "10px 20px", background: "#ffb300", border: "none",
                      borderRadius: 6, fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    Confirm Pickup
                  </button>
                )}
              </div>
            ) : (
              <div style={{ color: '#666', fontWeight: 600 }}>
                ⏳ Available (Not yet claimed)
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmPickupModal
        open={!!pickupOrderId}
        order={pickupOrderId}
        onClose={() => setPickupOrderId(null)}
        onSuccess={() => loadDonations()}
      />
    </div>
  );
}