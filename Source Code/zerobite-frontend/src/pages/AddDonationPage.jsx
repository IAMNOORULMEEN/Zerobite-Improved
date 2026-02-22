// src/pages/AddDonationPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authFetch from "../utils/authFetch";

export default function AddDonationPage() {
  const [form, setForm] = useState({
    name: "", quantity: 1, expiry_time: "", location: "", description: ""
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleFiles(e) {
    setFiles(Array.from(e.target.files));
  }

  function isoFromLocal(dtLocal) {
    if (!dtLocal) return "";
    const d = new Date(dtLocal);
    return d.toISOString();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("quantity", form.quantity);
      if (form.expiry_time) fd.append("expiry_time", isoFromLocal(form.expiry_time));
      fd.append("location", form.location);
      fd.append("description", form.description);
      files.forEach(f => fd.append("images", f));

      const res = await authFetch("/api/donations/", {
        method: "POST",
        body: fd
      });
      if (!res.ok) {
        const err = await res.text().catch(()=>null);
        alert(err || "Failed to post donation");
        setSubmitting(false);
        return;
      }
      navigate("/available");
    } catch (e) {
      console.error("submit error", e);
      alert("Network or server error");
      setSubmitting(false);
    }
  }

  return (
    <div className="page add-donation container" style={{ padding:24 }}>
      <h2>Post a donation</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth:720, display:"flex", flexDirection:"column", gap:12 }}>
        <label>
          Name
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          Quantity
          <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} />
        </label>
        <label>
          Expiry time (optional)
          <input type="datetime-local" value={form.expiry_time} onChange={e => setForm({ ...form, expiry_time: e.target.value })} />
        </label>
        <label>
          Location / Address
          <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </label>
        <label>
          Images (optional)
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
          {files.length > 0 && <div style={{ display:"flex", gap:8, marginTop:8 }}>{files.map((f,i)=>(<div key={i} style={{padding:6, background:"#f3f4f6", borderRadius:6}}>{f.name}</div>))}</div>}
        </label>

        <div style={{ display:"flex", gap:8 }}>
          <button className="btn primary" type="submit" disabled={submitting}>{submitting ? "Posting…" : "Post Donation"}</button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
