// src/components/AvailableDonationsList.jsx
import React, { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";

export default function AvailableDonationsList({ sourceFilter = "all" }) {
  const [items, setItems] = useState(null);

  const fetchItems = async (source) => {
    setItems(null);
    try {
      let url = `/api/donations/`;
      // you can add filters: ?role=RESTAURANT or ?include_expired=true
      if (source && source !== "all") url += `?source=${encodeURIComponent(source)}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error("fetchItems error", e);
      setItems([]); // show empty on error
    }
  };

  useEffect(() => {
    fetchItems(sourceFilter);
    const id = setInterval(() => fetchItems(sourceFilter), 60000); // refresh every 60s
    return () => clearInterval(id);
  }, [sourceFilter]);

  const handleClaim = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (items === null) return <div>Loading available donations…</div>;
  if (!items.length) return <div>No available donations right now.</div>;

  return (
    <div>
      {items.map(i => <DonationCard key={i.id} donation={i} onClaimed={handleClaim} />)}
    </div>
  );
}
