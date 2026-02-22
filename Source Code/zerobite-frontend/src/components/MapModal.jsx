// src/components/MapModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { useJsApiLoader, GoogleMap, Marker, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";

const LIBS = ["places"];
const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "";

export default function MapModal({ open, onClose, targetLocation /* { lat, lng, address? } */ }) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_KEY, libraries: LIBS });
  const [userLoc, setUserLoc] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsError, setDirectionsError] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const mapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDirections(null);
    setRouteInfo({ distance: null, duration: null });
    setDirectionsError(null);

    if (!navigator.geolocation) {
      setUserLoc(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc(null),
      { timeout: 10000 }
    );
  }, [open, targetLocation]);

  if (!open) return null;

  const center = targetLocation || userLoc || { lat: 13.0827, lng: 80.2707 };
  const zoom = (userLoc && targetLocation) ? 13 : 15;

  const directionsCallback = (result, status) => {
    if (status === "OK" && result) {
      setDirections(result);
      try {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text || null,
          duration: leg.duration?.text || null,
        });
      } catch (e) {
        setRouteInfo({ distance: null, duration: null });
      }
    } else {
      setDirections(null);
      setDirectionsError(status || "Directions error");
    }
  };

  const showDirections = !!userLoc && !!targetLocation?.lat && !!targetLocation?.lng;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <strong>Pickup location</strong>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={{ flex: 1 }}>
          {!GOOGLE_KEY && <div style={styles.hint}>Maps API key missing.</div>}
          {loadError && <div style={styles.hint}>Map failed to load. Check console / API key.</div>}

          {!isLoaded ? (
            <div style={styles.hint}>Loading map...</div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: 360, borderRadius: 8 }}
              center={center}
              zoom={zoom}
              onLoad={(map) => (mapRef.current = map)}
            >
              {targetLocation?.lat && targetLocation?.lng && (
                <Marker position={{ lat: Number(targetLocation.lat), lng: Number(targetLocation.lng) }} />
              )}
              {userLoc && <Marker position={{ lat: Number(userLoc.lat), lng: Number(userLoc.lng) }} label="You" />}

              {showDirections && !directions && (
                <DirectionsService
                  options={{
                    origin: userLoc,
                    destination: { lat: Number(targetLocation.lat), lng: Number(targetLocation.lng) },
                    travelMode: "DRIVING",
                    drivingOptions: { departureTime: new Date() },
                    unitSystem: window.google?.maps?.UnitSystem?.METRIC || 0,
                  }}
                  callback={directionsCallback}
                />
              )}

              {directions && <DirectionsRenderer options={{ directions }} />}
            </GoogleMap>
          )}
        </div>

        <div style={styles.footer}>
          <div style={{ fontSize: 13, color: "#444" }}>
            {targetLocation?.address ? targetLocation.address : (targetLocation?.lat ? `${Number(targetLocation.lat).toFixed(5)}, ${Number(targetLocation.lng).toFixed(5)}` : "No location")}
            {routeInfo.distance && routeInfo.duration && (
              <div style={{ marginTop: 8, color: "#222", fontWeight: 700 }}>
                🚗 {routeInfo.distance} • {routeInfo.duration}
              </div>
            )}
            {directionsError && <div style={{ color: "crimson", marginTop: 8 }}>Directions: {directionsError}</div>}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={
                userLoc && targetLocation?.lat && targetLocation?.lng
                  ? `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${targetLocation.lat},${targetLocation.lng}&travelmode=driving`
                  : targetLocation?.lat && targetLocation?.lng
                    ? `https://www.google.com/maps/search/?api=1&query=${targetLocation.lat},${targetLocation.lng}`
                    : `https://www.google.com/maps`
              }
              target="_blank"
              rel="noreferrer"
              style={styles.linkBtn}
            >
              Open in Google Maps
            </a>

            <button onClick={onClose} style={styles.btn}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.35)", zIndex: 9999,
  },
  modal: {
    width: 680, maxWidth: "96%", background: "#fff", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column",
    boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  closeBtn: { border: "none", background: "transparent", fontSize: 18, cursor: "pointer" },
  footer: { marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" },
  btn: { padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  linkBtn: { padding: "8px 12px", borderRadius: 6, textDecoration: "none", background: "#ffb300", color: "#000", display: "inline-block" },
  hint: { padding: 12, color: "#777" }
};
