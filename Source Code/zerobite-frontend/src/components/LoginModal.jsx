// src/components/LoginModal.jsx
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/_auth.scss";

const LoginModal = ({ show = false, onClose = () => {}, afterLoginRedirect = null }) => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "ngo",
    avatar: "avatar1.png",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // direct-reset (no email) state
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    if (!show) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleBackdropClick = (e) => {
    if (e.target.classList && e.target.classList.contains("auth-overlay")) onClose();
  };

  const avatars = ["avatar1.png", "avatar2.png", "avatar3.png", "avatar4.png", "avatar5.png"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        // Login
        const res = await axios.post("http://127.0.0.1:8000/api/login/", {
          username: formData.username,
          password: formData.password,
        });

        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        login({
          user: res.data.user,
          access: res.data.access,
          refresh: res.data.refresh,
        });

        if (res.data.access) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        }

        onClose && onClose();

        if (formData.username === "administrator" && formData.password === "cfgvb") {
          navigate("/admin/users");
        } else if (afterLoginRedirect) {
          navigate(afterLoginRedirect);
        } else {
          navigate("/");
        }
      } else {
        // Register
        await axios.post("http://127.0.0.1:8000/api/register/", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          avatar: formData.avatar,
        });
        setIsLogin(true);
        setFormData((p) => ({ ...p, password: "" }));
        alert("Registration successful. Please login.");
      }
    } catch (err) {
      const serverMsg =
        err?.response?.data && typeof err.response.data !== "string"
          ? JSON.stringify(err.response.data)
          : err?.response?.data || err?.message;
      setError(serverMsg || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- direct reset (username + new password) ----------
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    if (!forgotUsername) {
      setForgotError("Please enter the username.");
      return;
    }
    if (!forgotNewPassword) {
      setForgotError("Please enter a new password.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/reset-password-direct/", {
        username: forgotUsername,
        password: forgotNewPassword,
      });

      setForgotMessage(res?.data?.message || "Password updated successfully.");
      // auto-close back to login after a short delay
      setTimeout(() => {
        setForgotMode(false);
        setForgotUsername("");
        setForgotNewPassword("");
        setForgotMessage("");
      }, 1200);
    } catch (err) {
      const serverMsg =
        err?.response?.data && typeof err.response.data !== "string"
          ? JSON.stringify(err.response.data)
          : err?.response?.data || err?.message;
      setForgotError(serverMsg || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  if (!show) return null;

  let leftImg;
  try {
    leftImg = require("../assets/auth-illustration.png");
  } catch {
    leftImg = "/assets/auth-illustration.png";
  }

  return (
    <div className="auth-overlay" onClick={handleBackdropClick}>
      <div className="auth-card glass-oval">
        <button className="close-box" onClick={onClose} aria-label="Close" type="button">
          ✕
        </button>

        <div className="auth-grid">
          {/* Left illustration */}
          <div className="auth-illustration">
            <img src={leftImg} alt="auth illustration" />
          </div>

          {/* Right: form */}
          <div className="auth-panel">
            {/* if forgot Mode show the direct reset form */}
            {forgotMode ? (
              <>
                <h2 className="auth-title">Reset Password</h2>
                <form className="auth-form" onSubmit={handleForgotSubmit}>
                  <div className="field-row">
                    <input
                      className="auth-input"
                      name="forgotUsername"
                      placeholder="Enter username"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="field-row">
                    <input
                      className="auth-input"
                      name="forgotNewPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-row">
                    <button
                      type="submit"
                      className="auth-submit"
                      disabled={forgotLoading}
                      style={{ maxWidth: 260 }}
                    >
                      {forgotLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>

                {forgotError && <p className="auth-error">{forgotError}</p>}
                {forgotMessage && <p className="switch-text" style={{ color: "#a6f0c2" }}>{forgotMessage}</p>}

                <p className="switch-text" style={{ marginTop: 12 }}>
                  <span
                    className="switch-link"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setForgotMode(false);
                      setForgotError("");
                      setForgotMessage("");
                    }}
                  >
                    Back to login
                  </span>
                </p>
              </>
            ) : (
              <>
                <h2 className="auth-title">{isLogin ? "Login" : "Register"}</h2>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="field-row">
                    <input
                      className="auth-input"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  {!isLogin && (
                    <>
                      <div className="field-row">
                        <input
                          className="auth-input"
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="field-row">
                        <select
                          className="auth-input auth-select"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                        >
                          <option value="ngo">NGO</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="volunteer">Volunteer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="field-row">
                    <input
                      className="auth-input"
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {isLogin && (
                    <div className="field-row avatar-row">
                      <label className="avatar-label">Pick avatar</label>
                      <div className="avatar-grid">
                        {avatars.map((pic) => {
                          let src;
                          try {
                            src = require(`../assets/avatars/${pic}`);
                          } catch {
                            src = `/assets/avatars/${pic}`;
                          }
                          return (
                            <img
                              key={pic}
                              src={src}
                              alt={pic}
                              className={`avatar-option ${formData.avatar === pic ? "selected" : ""}`}
                              onClick={() =>
                                setFormData((p) => ({ ...p, avatar: pic }))
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="field-row">
                    <button
                      type="submit"
                      className="auth-submit"
                      disabled={loading}
                      style={{ maxWidth: 260 }}
                    >
                      {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
                    </button>
                  </div>
                </form>

                {error && <p className="auth-error">{error}</p>}

                <p className="switch-text">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span
                    className="switch-link"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setIsLogin((v) => !v);
                      setError("");
                    }}
                  >
                    {isLogin ? "Register" : "Login"}
                  </span>
                </p>

                {/* forgot password link (only in login view) */}
                {isLogin && (
                  <p className="switch-text" style={{ marginTop: 6 }}>
                    <span
                      className="forgot-link"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setForgotMode(true);
                        setForgotUsername(formData.username || "");
                        setForgotNewPassword("");
                        setForgotError("");
                        setForgotMessage("");
                      }}
                    >
                      Forgot password?
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
