// src/pages/ResetPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider"; // make sure this export exists
import "../styles/_auth.scss";

const ResetPassword = () => {
  const navigate = useNavigate();
  const toast = useToast(); // MUST call unconditionally (React hooks rule)

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!username) {
      setError("Please enter your username.");
      try { toast?.error?.("Please enter your username."); } catch {}
      return;
    }
    if (!password || password !== confirm) {
      setError("Passwords must match and not be empty.");
      try { toast?.error?.("Passwords must match and not be empty."); } catch {}
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/reset-password-direct/", {
        username: username.trim(),
        password,
      });

      const msg = res?.data?.message || "Password updated successfully.";
      setMessage(msg);
      try { toast?.success?.(msg); } catch {}
      setTimeout(() => {
        setUsername("");
        setPassword("");
        setConfirm("");
        navigate("/"); // or "/login" if you have that route
      }, 1100);
    } catch (err) {
      const serverMsg =
        err?.response?.data && typeof err.response.data !== "string"
          ? JSON.stringify(err.response.data)
          : err?.response?.data || err?.message;
      setError(serverMsg || "Failed to reset password.");
      try { toast?.error?.(serverMsg || "Failed to reset password."); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" style={{ zIndex: 1300 }}>
      <div className="auth-card glass-oval" style={{ maxWidth: 520 }}>
        <div style={{ padding: 22 }}>
          <h2 className="auth-title">Reset Password</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field-row">
              <input
                className="auth-input"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field-row">
              <input
                className="auth-input"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <input
                className="auth-input"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
                style={{ maxWidth: 260 }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>

          {error && <p className="auth-error" style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{error}</p>}
          {message && <p className="switch-text" style={{ color: "#a6f0c2", marginTop: 8 }}>{message}</p>}

          <p className="switch-text" style={{ marginTop: 12 }}>
            This form updates the password directly (no email required). Use the account username.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
