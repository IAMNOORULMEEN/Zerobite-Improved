// PickUpLocation.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader
} from "@react-google-maps/api";

// KEEP THIS OUTSIDE THE COMPONENT to avoid the "libraries prop as new array" warning
const LIBRARIES = ["places"];

// Load API key from env - adjust for your bundler (CRA uses REACT_APP_)
const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_API_KEY 

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "8px",
  overflow: "hidden",
  margin: "8px 0"
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center fallback

export default function PickUpLocation({ onLocationSelect = () => {}, initial = null }) {
  const [center, setCenter] = useState(initial?.lat && initial?.lng ? { lat: initial.lat, lng: initial.lng } : defaultCenter);
  const [marker, setMarker] = useState(initial?.lat && initial?.lng ? { lat: initial.lat, lng: initial.lng } : null);
  const [address, setAddress] = useState(initial?.address || "");
  const [mapLoaded, setMapLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: LIBRARIES
  });

  // Try to get user's current location on mount
  useEffect(() => {
    if (initial) return; // if initial provided, don't override
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCenter({ lat, lng });
        setMarker({ lat, lng });
        reverseGeocode({ lat, lng }).then((addr) => {
          if (addr) setAddress(addr);
          onLocationSelect({ lat, lng, address: addr || "" });
        });
      },
      (err) => {
        // user denied or error -> keep fallback center
        console.warn("Geolocation error:", err);
      },
      { timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reverse geocode helper
  const reverseGeocode = async ({ lat, lng }) => {
    if (!window.google || !window.google.maps) return "";
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
    try {
      const res = await geocoder.geocode({ location: latlng });
      if (res && res.length > 0) return res[0].formatted_address;
    } catch (e) {
      console.error("Reverse geocode failed", e);
    }
    return "";
  };

  const onLoadMap = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  const onUnmountMap = useCallback(() => {
    mapRef.current = null;
    setMapLoaded(false);
  }, []);

  const onPlaceChanged = async () => {
    const place = autocompleteRef.current?.getPlace?.();
    if (!place || !place.geometry) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const addr = place.formatted_address || place.name || "";
    setCenter({ lat, lng });
    setMarker({ lat, lng });
    setAddress(addr);
    onLocationSelect({ lat, lng, address: addr });
    // pan map
    if (mapRef.current) mapRef.current.panTo({ lat, lng });
  };

  const onMarkerDragEnd = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const addr = await reverseGeocode({ lat, lng });
    setMarker({ lat, lng });
    setAddress(addr);
    onLocationSelect({ lat, lng, address: addr || "" });
  };

  if (loadError) return <div>Map failed to load. Check your API key & network.</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div>
      <label style={{ display: "block", marginBottom: 6 }}>Pickup location</label>

      {/* Autocomplete input */}
      <Autocomplete
        onLoad={(autocomplete) => {
          autocompleteRef.current = autocomplete;
        }}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Search address or use current location"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box"
          }}
        />
      </Autocomplete>

      {/* Map */}
      <div style={{ marginTop: 8 }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          onLoad={onLoadMap}
          onUnmount={onUnmountMap}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {marker && (
            <Marker
              position={marker}
              draggable
              onDragEnd={onMarkerDragEnd}
            />
          )}
        </GoogleMap>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) {
              alert("Geolocation not supported by browser");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const addr = await reverseGeocode({ lat, lng });
                setCenter({ lat, lng });
                setMarker({ lat, lng });
                setAddress(addr);
                if (mapRef.current) mapRef.current.panTo({ lat, lng });
                onLocationSelect({ lat, lng, address: addr || "" });
              },
              (err) => {
                console.warn(err);
                alert("Unable to get current location. Please allow location access.");
              }
            );
          }}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          Use my current location
        </button>

        <button
          type="button"
          onClick={() => {
            if (!marker) {
              alert("No location selected yet");
              return;
            }
            onLocationSelect({ lat: marker.lat, lng: marker.lng, address });
            alert("Pickup location saved.");
          }}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          Confirm location
        </button>
      </div>

      <div style={{ marginTop: 10, color: "#555", fontSize: 14 }}>
        <strong>Selected:</strong> {address || (marker ? `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}` : "None")}
      </div>
    </div>
  );
}
