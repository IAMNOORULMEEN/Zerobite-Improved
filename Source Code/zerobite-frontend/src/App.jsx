// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Reward from "./pages/Reward";
import EditProfile from "./pages/EditProfile";
import Feedback from "./pages/Feedback";
import About from "./pages/About";
import Donate from "./pages/Donate";
import Contact from "./pages/Contact";
import AdminUsers from "./pages/AdminUsers";
import AdminLogin from "./pages/AdminLogin";
import DonationsList from "./components/DonationsList";
import AddDonationPage from "./pages/AddDonationPage";
import ResetPassword from "./pages/ResetPassword";
import OrderHistory from "./pages/OrderHistory";

// ✅ new imports for Sidebar links
import MyOffers from "./pages/MyOffers";            // user-only offers
import DonationHistory from "./pages/DonationHistory"; // all past donations
import NearbyRequests from "./pages/NearbyRequests";   // nearby requests
import Notifications from "./pages/Notifications";     // notifications page
import Help from "./pages/Help";                       // help & support

import { ToastProvider } from "./components/ToastProvider";
import "./styles/_toast.scss";
import "./styles/_auth.scss";

const GOOGLE_KEY = process.env.REACT_APP_GOOGLE_API_KEY || "";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_KEY} libraries={["places"]}>
      <ToastProvider>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={`page-wrapper ${sidebarOpen ? "shifted" : ""}`}>
          <Navbar onProfileClick={() => setSidebarOpen(true)} />

          <Routes>
            {/* Frontpage */}
            <Route path="/" element={<Home />} />

            {/* Static pages */}
            <Route path="/about" element={<About />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Profile / user routes */}
            <Route path="/reward" element={<Reward />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ✅ Sidebar-linked pages */}
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/donations" element={<DonationHistory />} />
            <Route path="/nearby-requests" element={<NearbyRequests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/help" element={<Help />} />
            <Route path="/orders" element={<OrderHistory />} />


            {/* Donations system */}
            <Route
              path="/available"
              element={
                <div className="container">
                  <h1>Available donations</h1>
                  <DonationsList />
                </div>
              }
            />
            <Route path="/available/add" element={<AddDonationPage />} />
          </Routes>
        </div>
      </ToastProvider>
    </LoadScript>
  );
}
