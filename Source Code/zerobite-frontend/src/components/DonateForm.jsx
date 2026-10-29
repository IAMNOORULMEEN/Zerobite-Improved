// src/components/DonateForm.jsx
import React, { useState } from "react";
import authFetch from "../utils/authFetch";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

export default function DonateForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    donor_name: "",
    contact_number: "",
    name: "",
    quantity: 1,
    location: "",
    expiry_time: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Simple Validation
    if (!form.contact_number.trim()) return setMessage("❌ Please enter a contact number.");
    if (!form.name.trim()) return setMessage("❌ Please enter the food name.");
    if (Number(form.quantity) <= 0) return setMessage("❌ Please enter a valid quantity.");
    if (!form.location.trim()) return setMessage("❌ Please enter a pickup location.");
    if (!form.expiry_time) return setMessage("❌ Please select an expiry time.");

    setLoading(true);
    try {
      const payload = {
        donor_name: form.donor_name || "Anonymous",
        contact_number: form.contact_number,
        name: form.name,
        quantity: Number(form.quantity),
        location: form.location,
        expiry_time: new Date(form.expiry_time).toISOString(),
        description: form.description || "",
      };

      const res = await authFetch(`${API_BASE.replace(/\/$/, "")}/donations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        if (data && typeof data === "object") {
          errMsg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ");
        }
        throw new Error(errMsg);
      }

      setMessage("✅ Donation posted successfully.");
      setForm({ donor_name: "", contact_number: "", name: "", quantity: 1, location: "", expiry_time: "", description: "" });
      
      if (onSuccess) {
        setTimeout(() => onSuccess(data), 1000); // Let the user see the success message briefly
      }
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
        <div style={{ marginBottom: 10, padding: 10, borderRadius: 5, background: message.startsWith("❌") ? "#ffebee" : "#e6f4ea", color: message.startsWith("❌") ? "#c5221f" : "#1e8e3e", fontWeight: 600 }}>
          {message}
        </div>
      )}

      <form className="donate-form" onSubmit={handleSubmit}>
        <input name="donor_name" placeholder="Your name (optional)" value={form.donor_name} onChange={handleChange} />
        <input name="contact_number" placeholder="Contact number" value={form.contact_number} onChange={handleChange} required />
        <input name="name" placeholder="Food name" value={form.name} onChange={handleChange} required />
        <input type="number" name="quantity" min="1" placeholder="Amount of food" value={form.quantity} onChange={handleChange} required />

        {/* Simple Text Input for Location (No Map Required) */}
        <input name="location" placeholder="Pickup location (e.g. Chennai)" value={form.location} onChange={handleChange} required />

        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#666' }}>Expiry Time:</label>
          <input type="datetime-local" name="expiry_time" value={form.expiry_time} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 5, border: '1px solid #ccc' }} />
        </div>

        <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />

        <div className="donate-action">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Posting…" : "Post Donation"}</button>
          {onCancel && <button className="btn secondary" type="button" onClick={onCancel} disabled={loading}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}