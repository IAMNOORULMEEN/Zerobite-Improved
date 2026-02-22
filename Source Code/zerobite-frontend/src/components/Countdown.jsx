// src/components/Countdown.jsx
import React, { useEffect, useState } from "react";

/**
 * props:
 *   iso (string) - ISO expiry_time (e.g. "2025-03-01T12:00:00Z")
 *   onExpire (function) optional - called when timer reaches 0
 */
export default function Countdown({ iso, onExpire }) {
  const calcRemaining = () => {
    if (!iso) return 0;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 0;
    const diff = Math.max(0, t - Date.now());
    return Math.floor(diff / 1000);
  };

  const [secLeft, setSecLeft] = useState(calcRemaining);

  useEffect(() => {
    setSecLeft(calcRemaining());
    if (!iso) return undefined;
    const id = setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (typeof onExpire === "function") onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  if (!iso) return null;
  if (secLeft <= 0) return <span className="tag expired">Expired</span>;

  const days = Math.floor(secLeft / 86400);
  const hours = Math.floor((secLeft % 86400) / 3600);
  const minutes = Math.floor((secLeft % 3600) / 60);
  const seconds = secLeft % 60;

  return (
    <span className="countdown" title={`Expires at ${new Date(iso).toLocaleString()}`}>
      {days > 0 ? `${days}d ` : ""}
      {String(hours).padStart(2, "0")}:
      {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </span>
  );
}
