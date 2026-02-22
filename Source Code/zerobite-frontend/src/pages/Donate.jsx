// src/pages/Donate.jsx
import React, { useState } from "react";
import DonateForm from "../components/DonateForm";
import DonationsList from "../components/DonationsList";
import "../styles/_donate.scss";

export default function Donate() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const notifyDonationsUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="page-donate">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Donate</h1>
        <button className="available-btn" onClick={openModal}>
          Post Donation
        </button>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2>Available donations</h2>
        <DonationsList key={refreshKey} />
      </section>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <button className="close-btn" onClick={closeModal}>
              ✖
            </button>
            <div className="modal-content">
              <div className="modal-left">
                <img
                  alt="Help"
                  src="/help.png"
                  style={{ width: "100%", borderRadius: "12px" }}
                />
              </div>

              <div className="modal-right">
                <h2>Fill the form to donate</h2>
                <DonateForm
                  onSuccess={() => {
                    notifyDonationsUpdated();
                    closeModal();
                  }}
                  onCancel={closeModal}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
