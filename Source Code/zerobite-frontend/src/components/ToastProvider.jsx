// src/components/ToastProvider.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idCounter;
    const timeout = opts.duration ?? 4200;
    setToasts((t) => [...t, { id, type, message }]);
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, timeout);
    }
    return id;
  }, []);

  const success = useCallback((msg, opts) => push("success", msg, opts), [push]);
  const error = useCallback((msg, opts) => push("error", msg, opts), [push]);
  const info = useCallback((msg, opts) => push("info", msg, opts), [push]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ success, error, info, remove }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            role="status"
            onClick={() => remove(t.id)}
          >
            <div className="toast-content">
              <strong className="toast-title">{t.type === "success" ? "Success" : t.type === "error" ? "Error" : "Info"}</strong>
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" aria-label="Close">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
