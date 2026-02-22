// src/components/NGORequestForm.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function NGORequestForm({ onSuccess }) {
  const [dateNeeded, setDateNeeded] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { accessToken } = useContext(AuthContext);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

  const submit = async (e) => {
    e.preventDefault();
    if (!accessToken && !localStorage.getItem('access')) { alert('Login as NGO to request'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || localStorage.getItem('access')}`,
        },
        body: JSON.stringify({ date_needed: dateNeeded, notes }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setDateNeeded(''); setNotes('');
      if (onSuccess) onSuccess(data);
      alert('Request created');
    } catch (e) {
      console.error(e);
      alert('Request failed: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <form className="ngo-request-form" onSubmit={submit}>
      <label>Date needed</label>
      <input type="date" value={dateNeeded} onChange={e=>setDateNeeded(e.target.value)} required />
      <label>Notes (optional)</label>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Request'}</button>
    </form>
  );
}
