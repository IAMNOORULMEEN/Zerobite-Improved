// src/components/DonateForm.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import authFetch from "../utils/authFetch";

const API_BASE =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";
const GOOGLE_KEY =
  process.env.REACT_APP_GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "";
const defaultCenter = { lat: 13.0827, lng: 80.2707 };
const mapLibraries = ["places"];

export default function DonateForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    donor_name: "",
    contact_number: "",
    name: "",
    quantity: 1,
    location: "",
    latitude: "",
    longitude: "",
    expiry_time: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [marker, setMarker] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: mapLibraries,
  });

  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  // Autocomplete state
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const acServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  // initialize Google services
  useEffect(() => {
    if (!isLoaded || !window.google) return;
    if (!acServiceRef.current)
      acServiceRef.current =
        new window.google.maps.places.AutocompleteService();
    if (!placesServiceRef.current) {
      const el = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        el
      );
    }
    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder();
  }, [isLoaded]);

  const round6str = (n) => {
    // return string with exactly up to 6 decimals (no trailing extra)
    if (typeof n !== "number") return n;
    return n.toFixed(6);
  };

  // reverse geocode helper
  const reverseGeocode = async ({ lat, lng }) => {
    try {
      if (!geocoderRef.current) return "";
      const res = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (res && res.length > 0) return res[0].formatted_address;
    } catch (err) {
      console.warn("reverseGeocode error", err);
    }
    return "";
  };

  // predictions (debounced)
  const fetchPredictions = (input) => {
    if (!isLoaded || !acServiceRef.current || !input || !input.trim()) {
      setPredictions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      acServiceRef.current.getPlacePredictions({ input }, (preds, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          Array.isArray(preds)
        ) {
          setPredictions(
            preds.map((p) => ({ description: p.description, place_id: p.place_id }))
          );
          setHighlightIndex(-1);
        } else {
          setPredictions([]);
        }
      });
    }, 240);
  };

  const onPickupInputChange = (e) => {
    const v = e.target.value;
    setSearchValue(v);
    setForm((p) => ({ ...p, location: v }));
    fetchPredictions(v);
  };

  const selectPrediction = (prediction) => {
    if (!prediction || !placesServiceRef.current) {
      setForm((p) => ({ ...p, location: prediction?.description || searchValue }));
      setSearchValue(prediction?.description || searchValue);
      setPredictions([]);
      return;
    }
    placesServiceRef.current.getDetails({ placeId: prediction.place_id }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addr = place.formatted_address || place.name || prediction.description || "";
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        const latStr = typeof lat === "number" ? round6str(lat) : "";
        const lngStr = typeof lng === "number" ? round6str(lng) : "";
        setSearchValue(addr);
        setPredictions([]);
        setForm((p) => ({
          ...p,
          location: addr,
          latitude: latStr || p.latitude,
          longitude: lngStr || p.longitude,
        }));
        if (lat && lng) {
          setMapCenter({ lat, lng });
          setMarker({ lat, lng });
          if (mapRef.current && mapRef.current.panTo) mapRef.current.panTo({ lat, lng });
        }
      } else {
        setForm((p) => ({ ...p, location: prediction.description || searchValue }));
        setSearchValue(prediction.description || searchValue);
        setPredictions([]);
      }
    });
  };

  const onPickupKeyDown = (e) => {
    if (!predictions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && predictions[highlightIndex]) {
        e.preventDefault();
        selectPrediction(predictions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setPredictions([]);
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    const onDocClick = (ev) => {
      if (!suggestionsRef.current) return;
      if (!suggestionsRef.current.contains(ev.target)) {
        setPredictions([]);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // map handlers
  const onLoadMap = useCallback((map) => (mapRef.current = map), []);

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const addr = (await reverseGeocode({ lat, lng })) || `${round6str(lat)}, ${round6str(lng)}`;

    setForm((p) => ({
      ...p,
      latitude: round6str(lat),
      longitude: round6str(lng),
      location: addr,
    }));
    setMarker({ lat, lng });
    setMapCenter({ lat, lng });
    setSearchValue(addr);
  };

  const handleMarkerDragEnd = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const addr = (await reverseGeocode({ lat, lng })) || `${round6str(lat)}, ${round6str(lng)}`;

    setForm((p) => ({
      ...p,
      latitude: round6str(lat),
      longitude: round6str(lng),
      location: addr,
    }));
    setMarker({ lat, lng });
    setMapCenter({ lat, lng });
    setSearchValue(addr);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const addr = (await reverseGeocode({ lat, lng })) || `${round6str(lat)}, ${round6str(lng)}`;
        setForm((p) => ({
          ...p,
          latitude: round6str(lat),
          longitude: round6str(lng),
          location: addr,
        }));
        setMarker({ lat, lng });
        setMapCenter({ lat, lng });
        setSearchValue(addr);
        if (mapRef.current && mapRef.current.panTo) mapRef.current.panTo({ lat, lng });
      },
      (err) => {
        alert("Location error: " + err.message);
      },
      { timeout: 10000 }
    );
  };

  // validation
  const validateBeforeSubmit = () => {
    if (!form.contact_number || !String(form.contact_number).trim()) return "Please enter a contact number.";
    if (!form.name || !String(form.name).trim()) return "Please enter the food name.";
    if (!form.quantity || Number(form.quantity) <= 0 || Number.isNaN(Number(form.quantity))) return "Please enter a valid quantity (>= 1).";
    const hasCoords = form.latitude !== "" && form.longitude !== "" && !Number.isNaN(Number(form.latitude)) && !Number.isNaN(Number(form.longitude));
    const hasLocationText = form.location && String(form.location).trim().length > 0;
    if (!hasCoords && !hasLocationText) return "Please select a pickup location (type & choose, or click on the map).";
    return null;
  };

  // submit with FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const clientValidation = validateBeforeSubmit();
    if (clientValidation) {
      setMessage("❌ " + clientValidation);
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("donor_name", form.donor_name || "");
      fd.append("contact_number", form.contact_number || "");
      fd.append("name", form.name || "");
      fd.append("quantity", Number(form.quantity));
      // always send location string (human readable) when available
      fd.append("location", form.location || "");

      // coords: already stored as strings with 6 decimals; append as strings
      if (form.latitude !== "" && form.longitude !== "") {
        const lat = Number(form.latitude);
        const lng = Number(form.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          fd.append("latitude", round6str(lat));
          fd.append("longitude", round6str(lng));
        }
      }

      if (form.expiry_time) {
        const iso = new Date(form.expiry_time).toISOString();
        fd.append("expiry_time", iso);
      }

      if (form.description) fd.append("description", form.description);

      console.log("DEBUG FormData sending:");
      for (const pair of fd.entries()) console.log(pair[0], "=", pair[1]);

      const res = await authFetch(`${API_BASE.replace(/\/$/, "")}/donations/`, {
        method: "POST",
        body: fd, // browser sets multipart content-type with boundary
      });

      const text = await res.text().catch(() => "");
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      console.log("DEBUG response", res.status, data);

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        if (data && typeof data === "object") {
          errMsg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
        } else if (data) errMsg = String(data);
        throw new Error(errMsg);
      }

      setMessage("✅ Donation posted successfully.");
      setForm({
        donor_name: "",
        contact_number: "",
        name: "",
        quantity: 1,
        location: "",
        latitude: "",
        longitude: "",
        expiry_time: "",
        description: "",
      });
      setMarker(null);
      setSearchValue("");
      if (onSuccess) onSuccess(data);
    } catch (err) {
      console.error("DonateForm submit error:", err);
      setMessage("❌ " + (err.message || "Failed to post donation"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-form-wrapper">
      {message && (
        <div style={{ marginBottom: 10, color: message.startsWith("❌") ? "#ffb4b4" : "#b7f2c3" }}>
          {message}
        </div>
      )}

      <form className="donate-form" onSubmit={handleSubmit}>
        <input name="donor_name" placeholder="Your name" value={form.donor_name} onChange={handleChange} />
        <input name="contact_number" placeholder="Contact number" value={form.contact_number} onChange={handleChange} required />
        <input name="name" placeholder="Food name" value={form.name} onChange={handleChange} required />
        <input type="number" name="quantity" min="1" placeholder="Amount of food" value={form.quantity} onChange={handleChange} required />

        {isLoaded && !loadError ? (
          <div style={{ position: "relative" }}>
            <input
              name="location"
              placeholder="Pickup location (type or click map)"
              value={searchValue || form.location}
              onChange={onPickupInputChange}
              onKeyDown={onPickupKeyDown}
              autoComplete="off"
              required
              style={{ width: "100%" }}
            />
            {predictions.length > 0 && (
              <ul ref={suggestionsRef} className="suggestions-dropdown">
                {predictions.map((p, idx) => (
                  <li
                    key={p.place_id}
                    onClick={() => selectPrediction(p)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`suggestion-item ${idx === highlightIndex ? "highlight" : ""}`}
                  >
                    {p.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <input name="location" placeholder="Pickup location" value={form.location} onChange={handleChange} required />
        )}

        {isLoaded && !loadError && (
          <div style={{ marginTop: 10 }}>
            <GoogleMap onLoad={onLoadMap} mapContainerStyle={{ width: "100%", height: "220px", borderRadius: 10 }} center={marker ? { lat: marker.lat, lng: marker.lng } : mapCenter} zoom={marker ? 15 : 13} onClick={handleMapClick}>
              {marker && <Marker position={{ lat: marker.lat, lng: marker.lng }} draggable onDragEnd={handleMarkerDragEnd} />}
            </GoogleMap>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={useMyLocation} className="btn">Use my location</button>
              <button type="button" onClick={() => {
                if (!marker) { alert("No location selected yet"); return; }
                alert("Pickup location set to:\n" + (form.location || `${marker.lat}, ${marker.lng}`));
              }} className="btn">Confirm on map</button>
            </div>
          </div>
        )}

        <input type="datetime-local" name="expiry_time" value={form.expiry_time} onChange={handleChange} />
        <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />

        <div className="donate-action">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Posting…" : "Post Donation"}</button>
          {onCancel && <button className="btn secondary" type="button" onClick={onCancel} disabled={loading}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
