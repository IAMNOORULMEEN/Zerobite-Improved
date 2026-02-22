// src/utils/authFetch.js
const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

/**
 * Simple refresh-lock so multiple simultaneous 401s won't trigger multiple refresh requests.
 * When a refresh is in progress, other callers wait for the same refresh promise.
 */
let refreshLock = null;

async function tryRefresh() {
  // If a refresh is already ongoing, reuse it
  if (refreshLock) {
    try {
      return await refreshLock;
    } catch {
      return false;
    }
  }

  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  refreshLock = (async () => {
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/token/refresh/`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        clearAuth();
        return false;
      }
      if (data && data.access) {
        localStorage.setItem("access", data.access);
        return true;
      }
      // no access token in response
      return false;
    } catch (err) {
      console.error("[authFetch] tryRefresh network error", err);
      clearAuth();
      return false;
    } finally {
      // release lock after finishing
      refreshLock = null;
    }
  })();

  return refreshLock;
}

function buildFullUrl(url) {
  if (typeof url !== "string") return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/api")) return API_BASE.replace(/\/$/, "") + url;
  if (url.startsWith("/")) return url; // absolute path on same origin
  return API_BASE.replace(/\/$/, "") + "/" + url.replace(/^\/+/, "");
}

export default async function authFetch(url, options = {}) {
  const fullUrl = buildFullUrl(url);

  const access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");

  // clone headers so we can modify without mutating caller object
  const headers = options.headers ? { ...options.headers } : {};

  // Don't set Content-Type for FormData bodies or for GET/HEAD
  const isFormData = options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();
  if (!isFormData && !headers["Content-Type"] && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  if (access) {
    headers["Authorization"] = `Bearer ${access}`;
  }

  // If Content-Type is JSON and body is an object, stringify it
  const opts = { ...options, headers };
  if (!isFormData && headers["Content-Type"] && headers["Content-Type"].includes("application/json") && opts.body && typeof opts.body !== "string") {
    try {
      opts.body = JSON.stringify(opts.body);
    } catch (err) {
      console.warn("[authFetch] could not JSON.stringify body, leaving as-is", err);
    }
  }

  let res;
  try {
    res = await fetch(fullUrl, opts);
  } catch (err) {
    console.error("[authFetch] network error", err);
    throw err;
  }

  // If we get a 401 and we have a refresh token, try to refresh and retry once.
  if (res.status === 401 && refresh) {
    const didRefresh = await tryRefresh();
    if (didRefresh) {
      const newAccess = localStorage.getItem("access");
      if (newAccess) headers["Authorization"] = `Bearer ${newAccess}`;
      try {
        res = await fetch(fullUrl, { ...options, headers });
      } catch (err) {
        console.error("[authFetch] network error on retry", err);
        throw err;
      }
    } else {
      // return a consistent JSON 401 Response so callers can parse it
      return new Response(JSON.stringify({ detail: "Session expired, please log in again." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return res;
}
