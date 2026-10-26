// src/components/ConfirmPickupModal.jsx
import React, { useState } from "react";
import authFetch from "../utils/authFetch";

export default function ConfirmPickupModal({ open, order, onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

    const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`orders/${order}/verify-code/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.detail || "Verification failed";
        const extra = data.remaining_attempts != null ? ` (${data.remaining_attempts} attempts left)` : "";
        alert("❌ " + msg + extra); // Using alert instead of toast
        return;
      }

      alert("✅ Pickup verified!"); // Using alert instead of toast
      onSuccess && onSuccess(data);
      setCode("");
      onClose();
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}>Confirm Pickup</h3>
        <p style={{ color: "#666", fontSize: 14 }}>
          Ask the NGO to read you the 6-digit code from their screen.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            style={input}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={onClose} style={btnSecondary} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={btnPrimary} disabled={submitting || code.length !== 6}>
              {submitting ? "Verifying…" : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline styles
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 };
const modal = { background: "#fff", borderRadius: 12, padding: 24, width: 380, maxWidth: "92%", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" };
const input = { width: "100%", fontSize: 28, letterSpacing: 8, textAlign: "center", fontFamily: "monospace", padding: 12, borderRadius: 8, border: "2px solid #ccc", outline: 'none' };
const btnPrimary = { padding: "10px 20px", background: "#ffb300", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" };
const btnSecondary = { padding: "10px 20px", background: "#eee", color: "#333", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 };