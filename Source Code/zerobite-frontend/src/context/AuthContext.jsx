// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();
const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refresh"));

  useEffect(() => {
    if (accessToken) localStorage.setItem("access", accessToken);
    else localStorage.removeItem("access");
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem("refresh", refreshToken);
    else localStorage.removeItem("refresh");
  }, [refreshToken]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = ({ user: u = null, access = null, refresh = null }) => {
    if (u) setUser(u);
    if (access) setAccessToken(access);
    if (refresh) setRefreshToken(refresh);
  };

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }, []);

  const getAccess = () => accessToken || localStorage.getItem("access");

  const refreshAccess = useCallback(async () => {
    try {
      const storedRefresh = refreshToken || localStorage.getItem("refresh");
      if (!storedRefresh) { logout(); return false; }
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: storedRefresh }),
      });
      if (!res.ok) { logout(); return false; }
      const data = await res.json();
      if (data.access) {
        setAccessToken(data.access);
        return true;
      }
      return false;
    } catch (e) {
      console.error("refreshAccess error", e);
      return false;
    }
  }, [refreshToken, logout]);

  // Optional: try refresh on mount if missing access but refresh present
  useEffect(() => {
    if (!accessToken && refreshToken) refreshAccess();
  }, [accessToken, refreshToken, refreshAccess]);

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, refreshToken, getAccess, login, logout, refreshAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
