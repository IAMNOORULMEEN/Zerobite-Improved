// src/components/DonationsList.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
} from "@react-google-maps/api";
import authFetch from "../utils/authFetch";
import Timer from "./Timer";
import "../styles/_donate.scss";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "";
const MAP_LIBRARIES = ["places"];

// helpers
function formatUrl(path, backendOrigin) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${backendOrigin}${path}`;
  return `${backendOrigin}/${path}`;
}

/* ---------- MapModal (small embedded component) ---------- */
function MapModal({ open, onClose, loc }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: MAP_LIBRARIES,
  });
  const [userLoc, setUserLoc] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) {
      setUserLoc(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setUserLoc(null),
      { timeout: 10000 }
    );
  }, [open]);

  if (!open) return null;

  const center = loc?.lat && loc?.lng ? { lat: loc.lat, lng: loc.lng } : (userLoc || { lat: 13.0827, lng: 80.2707 });
  const zoom = loc && userLoc ? 13 : 15;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <strong>Pickup location</strong>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ flex: 1 }}>
          {!GOOGLE_KEY && <div style={hintStyle}>Maps API key missing.</div>}
          {loadError && <div style={hintStyle}>Map failed to load. Check API key / console.</div>}
          {!isLoaded ? (
            <div style={hintStyle}>Loading map…</div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: 320, borderRadius: 8 }}
              center={center}
              zoom={zoom}
              onLoad={(m) => (mapRef.current = m)}
            >
              {loc?.lat && loc?.lng && <Marker position={{ lat: loc.lat, lng: loc.lng }} />}
              {userLoc && <Marker position={{ lat: userLoc.lat, lng: userLoc.lng }} label="You" />}
            </GoogleMap>
          )}
        </div>

        <div style={modalFooterStyle}>
          <div style={{ fontSize: 13, color: "#444" }}>
            {loc?.address ? loc.address : (loc?.lat ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "No location")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={
                userLoc && loc?.lat && loc?.lng
                  ? `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${loc.lat},${loc.lng}`
                  : loc?.lat && loc?.lng
                    ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                    : `https://www.google.com/maps`
              }
              target="_blank"
              rel="noreferrer"
              style={linkBtnStyle}
            >
              Open in Google Maps
            </a>
            <button onClick={onClose} style={btnStyle}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */
export default function DonationsList({ className = "" }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal state
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLoc, setMapLoc] = useState(null); // { lat, lng, address? }
  // loading per-donation order state
  const [placing, setPlacing] = useState({}); // { [donationId]: true/false }
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE.replace(/\/$/, "")}/donations/`;
        const res = await authFetch(url);
        if (!res.ok) throw new Error(`Could not fetch donations (${res.status})`);
        const data = await res.json();
        if (mounted) setDonations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("fetchDonations error:", err);
        if (mounted) setError(err.message || "Could not fetch donations");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDonations();
    return () => { mounted = false; };
  }, []);

  const pickThumbUrl = (d) => {
    if (d.thumbnail) return formatUrl(d.thumbnail, BACKEND_ORIGIN);
    return "/static/default_donation.jpg";
  };

  // Open the map modal for a donation
  const handleShowMap = (d) => {
    if (d.latitude && d.longitude) {
      setMapLoc({ lat: Number(d.latitude), lng: Number(d.longitude), address: d.location || d.address || "" });
      setMapOpen(true);
    } else {
      alert("Location not available for this donation.");
    }
  };

  // API helper for placing an order
  const placeOrderApi = async (body) => {
    const url = `${API_BASE.replace(/\/$/, "")}/orders/`;
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const err = (data && (data.detail || data.errors || JSON.stringify(data))) || `HTTP ${res.status}`;
      throw new Error(err);
    }
    return data;
  };

  const handlePlaceOrder = async (donation) => {
    setMsg(null);
    setPlacing((s) => ({ ...s, [donation.id]: true }));

    try {
      const payload = {
        donation: donation.id,
        confirmation_note: "Confirmed pickup",
        latitude: donation.latitude ? Number(donation.latitude) : null,
        longitude: donation.longitude ? Number(donation.longitude) : null,
      };

      // debug logs (remove in production)
      // eslint-disable-next-line no-console
      console.log("📦 place order payload:", payload);
      // eslint-disable-next-line no-console
      console.log("🔑 access token present:", !!localStorage.getItem("access"));

      // we don't need the returned data here; await to ensure completion
      await placeOrderApi(payload);

      // on success: remove or mark as claimed in UI
      setDonations((prev) => prev.filter((d) => d.id !== donation.id));
      setMsg("✅ Order placed successfully. Donor will be notified.");
    } catch (err) {
      console.error("Place order error:", err);
      setMsg("❌ " + (err.message || "Failed to place order"));
    } finally {
      setPlacing((s) => ({ ...s, [donation.id]: false }));
    }
  };

  if (loading) return <div className="donations-loading">Loading donations…</div>;
  if (error) return <div className="donations-error">{error}</div>;
  if (!donations.length) return <div className="donations-empty">No donations currently posted.</div>;

  return (
    <>
      {msg && <div style={{ margin: 10, color: msg.startsWith("❌") ? "#ff6b6b" : "#2ecc71" }}>{msg}</div>}
      <div className={`donations-grid sketch-grid ${className}`}>
        {donations.map((d) => {
          const thumb = pickThumbUrl(d);
          return (
            <div key={d.id} className="donation-card sketch-card">
              <div className="donation-thumb sketch-thumb">
                <img
                  src={thumb}
                  alt={d.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/static/default_donation.jpg";
                  }}
                  width="110"
                  height="110"
                  style={{ objectFit: "cover", display: "block" }}
                />
              </div>

              <div className="donation-body sketch-body">
                <h3 className="donation-title">{d.name}</h3>
                <div className="donation-desc-line">
                  {d.description || "No description"}
                </div>

                <div className="donation-meta-line">
                  <span className="donation-quantity">{d.quantity}</span>
                  <span>{d.location || "No location"}</span>
                </div>

                <div className="donation-meta-line">
                  <strong>📞 {d.contact_number || "Not provided"}</strong>
                </div>

                <div className="donation-meta-line" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 13 }}>
                    {d.donor_username || "Anonymous"}
                  </span>
                  {d.donor_role && (
                    <span
                      style={{
                        marginLeft: 8,
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        background:
                          d.donor_role.toLowerCase() === "restaurant"
                            ? "rgba(10,132,255,0.10)"
                            : "rgba(45,200,120,0.08)",
                        color:
                          d.donor_role.toLowerCase() === "restaurant"
                            ? "#0a84ff"
                            : "#2dc878",
                      }}
                    >
                      {d.donor_role}
                    </span>
                  )}
                  <span style={{ marginLeft: "auto", fontWeight: 700 }}>
                    <Timer expiryTime={d.expiry_time} />
                  </span>
                </div>

                <div
                  className="sketch-actions"
                  style={{ display: "flex", gap: 8, marginTop: 8 }}
                >
                  {!d.is_claimed && !d.is_expired ? (
                    <>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleShowMap(d)}
                      >
                        Show map
                      </button>

                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handlePlaceOrder(d)}
                        disabled={!!placing[d.id]}
                      >
                        {placing[d.id] ? "Placing…" : "Place order"}
                      </button>
                    </>
                  ) : d.is_claimed ? (
                    <span className="tag claimed">Claimed</span>
                  ) : (
                    <span className="tag expired">Expired</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} loc={mapLoc} />
    </>
  );
}

/* ---------- styles used by MapModal (inline to avoid adding new CSS file) ---------- */
const overlayStyle = {
  position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(0,0,0,0.35)", zIndex: 9999,
};
const modalStyle = {
  width: 680, maxWidth: "96%", background: "#fff", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column",
  boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
};
const modalHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 };
const modalFooterStyle = { marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" };
const closeBtnStyle = { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" };
const hintStyle = { padding: 12, color: "#777" };
const btnStyle = { padding: "8px 12px", borderRadius: 6, cursor: "pointer" };
const linkBtnStyle = { padding: "8px 12px", borderRadius: 6, textDecoration: "none", background: "#ffb300", color: "#000", display: "inline-block" };
