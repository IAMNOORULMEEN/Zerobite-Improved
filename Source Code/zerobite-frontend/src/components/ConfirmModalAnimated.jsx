import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../styles/_confirm-modal.scss";

export default function ConfirmModalAnimated({
  open,
  title = "Confirm Your Order",
  message = "",
  initialNote = "",
  onCancel,
  onSave,
  onComplete,
  savingText = "Saving...",
}) {
  const [note, setNote] = useState(initialNote || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const truckRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // Reset animation vars
      const button = btnRef.current;
      const truck = truckRef.current;
      const box = boxRef.current;
      setNote(initialNote || "");
      setLoading(false);
      setDone(false);
      if (button) {
        button.classList.remove("animation", "done");
        button.style.setProperty("--progress", 0);
      }
      if (truck) gsap.set(truck, { x: 4 });
      if (box) gsap.set(box, { x: -24, y: -6 });
    }
  }, [open, initialNote]);

  if (!open) return null;

  const playTruckAnimation = (onFinish) => {
    const button = btnRef.current;
    const box = boxRef.current;
    const truck = truckRef.current;
    if (!button || !box || !truck) {
      onFinish && onFinish();
      return;
    }

    if (!button.classList.contains("animation")) {
      button.classList.add("animation");

      gsap.to(button, { "--box-s": 1, "--box-o": 1, duration: 0.3, delay: 0.5 });
      gsap.to(box, { x: 0, duration: 0.4, delay: 0.7 });
      gsap.to(button, { "--hx": -5, "--bx": 50, duration: 0.18, delay: 0.92 });
      gsap.to(box, { y: 0, duration: 0.1, delay: 1.15 });
      gsap.set(button, { "--truck-y": 0, "--truck-y-n": -26 });

      gsap.to(button, {
        "--truck-y": 1,
        "--truck-y-n": -25,
        duration: 0.2,
        delay: 1.25,
        onComplete() {
          gsap
            .timeline({
              onComplete() {
                button.classList.add("done");
                gsap.to(button.querySelector(".success svg"), {
                  "--offset": 0,
                  duration: 0.35,
                });
                onFinish && onFinish();
              },
            })
            .to(truck, { x: 0, duration: 0.4 })
            .to(truck, { x: 40, duration: 1 })
            .to(truck, { x: 20, duration: 0.6 })
            .to(truck, { x: 96, duration: 0.4 });

          gsap.to(button, {
            "--progress": 1,
            duration: 2.4,
            ease: "power2.in",
          });
        },
      });
    }
  };

  const handleConfirm = async () => {
    if (!note.trim()) {
      alert("Please enter a short confirmation message.");
      return;
    }

    setLoading(true);
    let coords = null;

    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    } catch {
      alert("Could not get location. Please enable GPS.");
      setLoading(false);
      return;
    }

    try {
      const payload = { confirmation_note: note, ...coords };
      const result = await onSave(payload);
      playTruckAnimation(() => {
        setDone(true);
        setLoading(false);
        onComplete && onComplete(result);
        setTimeout(() => onCancel && onCancel(), 800);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to confirm order. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card confirm-modal">
        <h3>{title}</h3>
        {message && <p className="muted">{message}</p>}

        <label className="confirm-label">
          <textarea
            placeholder="Enter a short confirmation message..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </label>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancel
          </button>

          {/* Truck button */}
          <button
            ref={btnRef}
            className={`truck-button ${done ? "done" : ""}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            <span className="default">{loading ? savingText : "Complete Order"}</span>
            <span className="success">
              Order Placed
              <svg viewBox="0 0 12 10">
                <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
              </svg>
            </span>

            <div className="truck" ref={truckRef}>
              <div className="wheel" />
              <div className="back" />
              <div className="front" />
              <div className="box" ref={boxRef} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
