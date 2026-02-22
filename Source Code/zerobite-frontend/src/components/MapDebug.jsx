// MapDebug.jsx
import React, { useEffect, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "";
const LIBRARIES = ["places"];

export default function MapDebug() {
  const [geo, setGeo] = useState({ supported: !!navigator.geolocation, allowed: null, coords: null, err: null });
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((g) => ({ ...g, supported: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo((g) => ({ ...g, allowed: true, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } })),
      (err) => setGeo((g) => ({ ...g, allowed: false, err: err.message })),
      { timeout: 10000 }
    );
  }, []);

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 6 }}>
      <h4>Map / Geolocation debug</h4>
      <div><strong>ENV key present?</strong> {GOOGLE_KEY ? "✅ yes" : "❌ NO"}</div>
      <div><strong>useJsApiLoader isLoaded</strong> {String(isLoaded)}</div>
      <div><strong>useJsApiLoader loadError</strong> {loadError ? JSON.stringify(loadError) : "null"}</div>
      <div><strong>window.google?</strong> {typeof window !== "undefined" && window.google && window.google.maps ? "✅ yes" : "❌ no"}</div>
      <div style={{ marginTop: 8 }}>
        <strong>Geolocation supported:</strong> {String(geo.supported)}<br/>
        <strong>Permission allowed:</strong> {String(geo.allowed)}<br/>
        <strong>Coords:</strong> {geo.coords ? `${geo.coords.lat.toFixed(5)}, ${geo.coords.lng.toFixed(5)}` : "n/a"}<br/>
        <strong>Geo err:</strong> {geo.err || "none"}
      </div>
      <div style={{ marginTop: 10, color: "#555" }}>
        If isLoaded is false and loadError is present, copy the exact loadError message or the console Google Maps API error.
      </div>
    </div>
  );
}
