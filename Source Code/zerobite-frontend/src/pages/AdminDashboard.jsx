// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import authFetch from "../utils/authFetch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await authFetch("admin/stats/");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="container"><p>Loading dashboard data...</p></div>;
  if (!user || (!user.is_staff && !user.is_superuser)) {
    return <div className="container"><p style={{ color: "red" }}>Access Denied. Admins only.</p></div>;
  }
  if (!data) return <div className="container"><p>Error loading data.</p></div>;

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      <h1>Admin Dashboard</h1>
      
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#1a73e8" }}>{data.totals.donations}</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Total Donations</p>
        </div>
        <div style={cardStyle}>
          <h2 style={{ margin: 0, color: "#1e8e3e" }}>{data.totals.claimed}</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Claimed (Pickups)</p>
        </div>
        <div style={{ ...cardStyle, background: "#fff3e0" }}>
          <h2 style={{ margin: 0, color: "#b06000" }}>{data.totals.available}</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Currently Available</p>
        </div>
        <div style={{ ...cardStyle, background: "#ffebee" }}>
          <h2 style={{ margin: 0, color: "#c5221f" }}>{data.totals.expired}</h2>
          <p style={{ margin: 0, color: "#555", fontWeight: 600 }}>Expired</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ background: "#fff", padding: 24, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>Donations Over Time</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#ffb300" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  textAlign: "center",
  border: "1px solid #eaeaea"
};