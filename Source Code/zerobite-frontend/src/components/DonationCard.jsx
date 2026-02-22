// src/components/DonationCard.jsx
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "./ToastProvider";
import ConfirmModalAnimated from "./ConfirmModalAnimated";
import authFetch from "../utils/authFetch";

export default function DonationCard({ offer, onReserved }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [reserved, setReserved] = useState(false);

  // Handle "Place Order" click
  const handlePlaceOrder = () => {
    if (!user) {
      showToast("Please log in to continue.", "error");
      return;
    }

    // case-insensitive role check
    const role = (user.role || "").toString().toUpperCase();
    if (role !== "NGO" && role !== "VOLUNTEER") {
      showToast("Only NGOs or Volunteers can place orders.", "warning");
      return;
    }

    setModalOpen(true);
  };

  // Save order to backend - called by ConfirmModalAnimated
  const handleSave = async (payload = {}) => {
    // Defensive unpack + defaults
    const rawNote = (payload.confirmation_note ?? "").toString();
    const confirmation_note = rawNote.trim() || "Confirmed pickup";
    const latitude = payload.latitude != null ? Number(payload.latitude) : null;
    const longitude = payload.longitude != null ? Number(payload.longitude) : null;

    // Validate offer id exists
    if (!offer || !offer.id) {
      showToast("Invalid donation data (missing id).", "error");
      throw new Error("Missing donation id");
    }

    const body = {
      donation: Number(offer.id),
      confirmation_note,
      latitude,
      longitude,
    };

    // Log payload for debugging
    // (Remove or reduce in production)
    // eslint-disable-next-line no-console
    console.log("📦 Order payload:", body);
    // eslint-disable-next-line no-console
    console.log("🔑 access token present:", !!localStorage.getItem("access"));

    try {
      const res = await authFetch("/api/orders/", {
        method: "POST",
        body,
      });

      // read body once
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        // Prefer explicit messages from backend
        const msg =
          (data && (data.detail || data.error || JSON.stringify(data))) ||
          `Failed to place order (status ${res.status})`;
        showToast(msg, "error");
        throw new Error(msg);
      }

      // Success
      setModalOpen(false);
      setReserved(true);
      showToast("Order confirmed successfully!", "success");
      onReserved && onReserved(offer.id, data);
      return data;
    } catch (err) {
      // log & rethrow so modal can handle animation/error as needed
      // eslint-disable-next-line no-console
      console.error("Order save failed:", err);
      // Already shown toast above for server messages; ensure fallback:
      if (!err.message) showToast("Error placing order.", "error");
      throw err;
    }
  };

  return (
    <div className={`donation-card ${reserved ? "is-reserved" : ""}`}>
      <div className="card-top">
        <img
          src={offer?.image || "/assets/default-food.png"}
          alt={offer?.title || "Donation"}
          className="card-img"
        />
        <div className="card-info">
          <h3>{offer?.title}</h3>
          <p>{offer?.description}</p>
          <p>
            <strong>{offer?.quantity}</strong> portions in {offer?.city}
          </p>
          <p>
            <a href={`tel:${offer?.phone}`} className="phone-link">
              📞 {offer?.phone}
            </a>
          </p>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-secondary">Show map</button>
        <button
          className={`btn ${reserved ? "btn-disabled" : "btn-primary"}`}
          onClick={handlePlaceOrder}
          disabled={reserved}
        >
          {reserved ? "Reserved" : "Place Order"}
        </button>
      </div>

      {/* Truck animation modal for order confirmation */}
      <ConfirmModalAnimated
        open={modalOpen}
        title="Confirm Pickup"
        message={`You are about to confirm the pickup for "${offer?.title || "this donation"}".`}
        onCancel={() => setModalOpen(false)}
        onSave={handleSave}
        onComplete={() => setReserved(true)}
      />
    </div>
  );
}
