// src/components/Timer.jsx
import React, { useEffect, useState } from "react";

/**
 * Timer component (self-contained)
 * - expiryTime: ISO datetime string (e.g. "2025-09-26T13:43:00Z") OR null
 * - onExpire: optional callback when it reaches 0
 * - className/style: optional styling
 */
export default function Timer({ expiryTime, onExpire, className, style }) {
  const computeRemaining = (iso) => {
    if (!iso) return null;
    const ms = Date.parse(iso);
    if (isNaN(ms)) return null;
    return Math.max(0, Math.floor((ms - Date.now()) / 1000));
  };

  const [remaining, setRemaining] = useState(() => computeRemaining(expiryTime));

  useEffect(() => {
    // recompute immediately if expiryTime changes
    setRemaining(computeRemaining(expiryTime));

    if (!expiryTime) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        const next = computeRemaining(expiryTime);
        if (next === 0 && prev !== 0 && onExpire) {
          try { onExpire(); } catch (e) { /* ignore callback errors */ }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [expiryTime, onExpire]);

  if (remaining == null) return <span className={className} style={style}>No expiry</span>;
  if (remaining <= 0) return <span className={className} style={style}>00:00:00</span>;

  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;
  const text = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  return <span className={className} style={style}>{text}</span>;
}
