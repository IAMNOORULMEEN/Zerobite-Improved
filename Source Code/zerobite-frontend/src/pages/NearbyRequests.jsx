// src/components/NearbyRequests.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const NearbyRequests = ({ radiusKm = 10 }) => {
  const { token } = useContext(AuthContext);
  const [coords, setCoords] = useState(null);
  const [requests, setRequests] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    const load = async () => {
      setLoading(true);
      try {
        // Option A (recommended): server-side endpoint accepts lat/lng/radius
        // const res = await axios.get(`/api/requests?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusKm}`, { headers: { Authorization: `Bearer ${token}` }});

        // Option B: fetch all and filter client-side (OK for prototyping)
        const res = await axios.get("/api/requests", { headers: { Authorization: `Bearer ${token}` }});
        const list = res.data || [];

        // filter for nearby (ensure each item has .lat and .lng or .location.coords)
        const nearbyList = list
          .map((r) => {
            const lat = r.lat || (r.location && r.location.lat);
            const lng = r.lng || (r.location && r.location.lng);
            if (lat == null || lng == null) return null;
            const distance = haversineDistance(coords.lat, coords.lng, Number(lat), Number(lng));
            return { ...r, distance };
          })
          .filter(Boolean)
          .filter((r) => r.distance <= radiusKm)
          .sort((a, b) => a.distance - b.distance);

        setRequests(list);
        setNearby(nearbyList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [coords, radiusKm, token]);

  if (geoError) return <div>Location error: {geoError}</div>;
  if (!coords) return <div>Obtaining your location…</div>;
  if (loading) return <div>Loading nearby requests…</div>;

  return (
    <div>
      <h2>Nearby Requests (within {radiusKm} km)</h2>
      {!nearby.length && <p>No nearby requests found right now.</p>}
      <ul>
        {nearby.map((r) => (
          <li key={r.id || `${r.lat}-${r.lng}-${r.id}`}>
            <strong>{r.title || r.item || "Request"}</strong>
            <div>{r.quantity ? `${r.quantity}` : ""} • {r.address || r.location?.label || ""}</div>
            <div>{r.distance.toFixed(1)} km away</div>
            <button onClick={() => console.info("Accept request", r.id)}>Accept</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NearbyRequests;
