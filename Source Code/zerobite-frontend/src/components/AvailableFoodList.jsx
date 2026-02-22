import React, { useEffect, useState, useContext } from 'react';
import FoodCard from './FoodCard';
import { AuthContext } from '../context/AuthContext';

export default function AvailableFoodList({ sourceFilter = 'all' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
  const { accessToken, refreshAccess } = useContext(AuthContext);

  const fetchItems = async (source) => {
    setLoading(true);
    try {
      let url = `${apiUrl}/food/?available=true`;
      if (source && source !== 'all') url += `&source=${source}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error('fetch items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(sourceFilter);
  }, [sourceFilter]);

  const handleClaim = async (item) => {
    // Example: claim would mark is_claimed = true (POST/PATCH)
    const token = accessToken || localStorage.getItem('access');
    if (!token) {
      alert('Please login to claim');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/food/${item.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_claimed: true, is_available: false }),
      });
      if (!res.ok) {
        if (res.status === 401 && typeof refreshAccess === 'function') {
          const did = await refreshAccess();
          if (did) return handleClaim(item); // retry
        }
        throw new Error('Claim failed');
      }
      // update local list
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_claimed: true, is_available:false } : i));
    } catch (e) {
      console.error(e);
      alert('Claim failed: ' + e.message);
    }
  };

  if (loading) return <div>Loading available food…</div>;
  if (!items.length) return <div>No available food right now.</div>;

  return (
    <div className="available-food-list">
      {items.map(i => <FoodCard key={i.id} item={i} onClaim={handleClaim} />)}
    </div>
  );
}
