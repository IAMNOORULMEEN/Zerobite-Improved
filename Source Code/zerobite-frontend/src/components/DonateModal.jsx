// src/components/DonateModal.jsx
import React from "react";
import DonateForm from "./DonateForm";
import "../styles/_donate.scss";

export default function DonateModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay donate-modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box donate-modal-box" role="document">
        <button className="close-btn" onClick={onClose} aria-label="Close">✖</button>

        <div className="modal-content donate-modal-content">
          <div className="modal-left donate-modal-left">
            {/* Illustration — keep lightweight */}
            <img
              src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.shutterstock.com%2Fsearch%2Fblue-donate%3Fimage_type%3Dillustration&psig=AOvVaw18Jkdeo0zNCzu16dvbMQUm&ust=1758923477790000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCIDC29_y9I8DFQAAAAAdAAAAABAE"
              alt="help illustration"
              className="donate-illustration"
            />
          </div>

          <div className="modal-right donate-modal-right">
            <h2 className="donate-title">Fill the form to donate</h2>

            <DonateForm
              onSuccess={(data) => {
                if (onSuccess) onSuccess(data);
                onClose();
              }}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
