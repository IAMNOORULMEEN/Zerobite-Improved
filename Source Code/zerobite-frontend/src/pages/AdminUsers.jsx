// src/pages/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/_admin.scss";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in as admin to view this page.");
      setLoadingUsers(false);
      setLoadingDonations(false);
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchUsers(), fetchDonations()]);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/users/`, {
        headers: { ...getAuthHeaders() },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("fetchUsers error", err?.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized. Please login as admin.");
      } else if (err.response && err.response.status === 403) {
        setError("Forbidden. You don't have permission to view users.");
      } else {
        setError("Failed to fetch users.");
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const res = await axios.get(`${API_BASE}/donations/`, {
        headers: { ...getAuthHeaders() },
      });
      // API returns list of donations (not paginated here)
      setDonations(res.data);
    } catch (err) {
      console.error("fetchDonations error", err?.response?.data || err.message);
      if (err.response && err.response.status === 401) {
        setError("Unauthorized. Please login as admin.");
      } else {
        setError("Failed to fetch donations.");
      }
    } finally {
      setLoadingDonations(false);
    }
  };

  const confirmAndDeleteUser = async (id, username, is_superuser) => {
    if (is_superuser) {
      alert("Cannot delete a superuser.");
      return;
    }
    if (!window.confirm(`Delete user "${username}"? This is permanent.`)) return;

    try {
      const url = `${API_BASE}/users/${id}/`; // <- correct endpoint
      console.log("Deleting user URL:", url);
      const res = await axios.delete(url, {
        headers: { ...getAuthHeaders() },
      });
      console.log("delete response:", res.status, res.data);
      // remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("deleteUser error full:", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 401) {
        alert("Unauthorized — please log in again. (401)");
      } else if (status === 403) {
        alert("Forbidden — you don't have permission to delete users. (403)");
      } else if (status === 404) {
        alert("Not found — user or endpoint not found. (404)");
      } else if (status === 405) {
        alert("Method not allowed on this endpoint. (405)");
      } else {
        const msg = data?.detail || data?.error || JSON.stringify(data) || err.message;
        alert("Failed to delete user: " + msg);
      }
    }
  };

  const confirmAndDeleteDonation = async (id, name) => {
    if (!window.confirm(`Delete donation "${name}" (id ${id})? This is permanent.`)) return;
    try {
      const url = `${API_BASE}/donations/${id}/`;
      console.log("Deleting donation URL:", url);
      await axios.delete(url, {
        headers: { ...getAuthHeaders() },
      });
      setDonations((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("deleteDonation error", err?.response?.data || err.message);
      alert("Failed to delete donation.");
    }
  };

  if (error) {
    return (
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <section className="admin-section">
        <h2>Users</h2>
        {loadingUsers ? (
          <p>Loading users…</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Staff</th>
                  <th>Superuser</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="7">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.role}</td>
                    <td>{u.is_staff ? "✅" : "—"}</td>
                    <td>{u.is_superuser ? "✅" : "—"}</td>
                    <td>
                      {!u.is_superuser && (
                        <button
                          className="danger-btn"
                          onClick={() => confirmAndDeleteUser(u.id, u.username, u.is_superuser)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Donations</h2>
        {loadingDonations ? (
          <p>Loading donations…</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table donations-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Donor</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Expiry</th>
                  <th>Claimed</th>
                  <th>Expired</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr><td colSpan="9">No donations found.</td></tr>
                ) : donations.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</td>
                    <td>{d.donor_username || "—"}</td>
                    <td>{d.quantity}</td>
                    <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.location || "—"}</td>
                    <td>{d.expiry_time ? new Date(d.expiry_time).toLocaleString() : "—"}</td>
                    <td>{d.is_claimed ? "✅" : "—"}</td>
                    <td>{d.is_expired ? "✅" : "—"}</td>
                    <td>
                      <button
                        className="danger-btn"
                        onClick={() => confirmAndDeleteDonation(d.id, d.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
