// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await authFetch("notifications/");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

  const markAsRead = async (id) => {
    try {
      await authFetch(`notifications/${id}/read/`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container"><p>Loading notifications...</p></div>;

  return (
    <div className="container">
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>You have no notifications.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notifications.map((n) => (
            <li
              key={n.id}
              style={{
                padding: 16,
                marginBottom: 12,
                borderRadius: 8,
                border: "1px solid #ddd",
                background: n.is_read ? "#fff" : "#e8f0fe", // Highlight unread
                cursor: n.is_read ? "default" : "pointer",
              }}
              onClick={() => !n.is_read && markAsRead(n.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{n.title}</strong>
                <small style={{ color: "#888" }}>
                  {new Date(n.created_at).toLocaleString()}
                </small>
              </div>
              <p style={{ margin: "8px 0 0 0", color: "#444" }}>{n.message}</p>
              {!n.is_read && <span style={{ fontSize: 12, color: "#1a73e8", marginTop: 8, display: "inline-block" }}>Click to mark as read</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}