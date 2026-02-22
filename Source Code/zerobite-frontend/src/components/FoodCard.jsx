// src/components/FoodCard.jsx
import React from "react";

export default function FoodCard({ item, onClaim }) {
  // compute avatar path (works with CRA require or plain /assets served path)
  const avatarSrc = item?.donor_avatar
  ? `/assets/avatars/${item.donor_avatar}`
  : "/assets/avatars/avatar1.png";

  return (
    <div className="food-card" style={{
      borderRadius: 10, padding: 12, background: "#fff",
      boxShadow: "0 6px 18px rgba(0,0,0,0.06)", marginBottom: 12
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
        <div>
          <div style={{fontSize:16, fontWeight:600}}>{item.name} <span style={{fontWeight:400, fontSize:12}}>×{item.quantity}</span></div>
          <div style={{fontSize:13, color:"#666"}}>{item.location} {item.expiry_time ? `• ${new Date(item.expiry_time).toLocaleString()}` : ""}</div>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12, color:"#888"}}>Donor</div>
            <div style={{fontWeight:600}}>{item.donor_username || item.donor}</div>
          </div>
          <img src={avatarSrc} alt="avatar" style={{width:40, height:40, borderRadius:999}} />
        </div>
      </div>

      {item.description ? <p style={{marginTop:10, color:"#444"}}>{item.description}</p> : null}

      <div style={{display:"flex", justifyContent:"space-between", marginTop:12}}>
        <div>
          <span style={{
            background: "#eef6ff", color: "#0b5cff", padding: "4px 8px",
            borderRadius: 999, fontSize:12
          }}>{item.is_claimed ? "Claimed" : "Available"}</span>
        </div>
        <div>
          <button
            disabled={item.is_claimed}
            onClick={() => onClaim && onClaim(item)}
            style={{
              background: item.is_claimed ? "#ddd" : "#06c", color:"#fff",
              border:"none", padding:"8px 12px", borderRadius:8, cursor:item.is_claimed?"default":"pointer"
            }}
          >
            {item.is_claimed ? "Claimed" : "Claim"}
          </button>
        </div>
      </div>
    </div>
  );
}
