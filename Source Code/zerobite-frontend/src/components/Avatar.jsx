// src/components/Avatar.jsx
import React from "react";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import avatar5 from "../assets/avatars/avatar5.png";

const AVATAR_MAP = {
  "avatar1.png": avatar1,
  "avatar2.png": avatar2,
  "avatar3.png": avatar3,
  "avatar4.png": avatar4,
  "avatar5.png": avatar5,
};

export default function Avatar({
  avatarName = "avatar1.png",
  size = 34,
  alt = "avatar",
  className = "",
}) {
  // normalize input (just in case backend gives a path instead of filename)
  const key = avatarName?.split("/").pop();
  const src = AVATAR_MAP[key] || AVATAR_MAP["avatar1.png"];

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`avatar ${className}`}
      style={{
        borderRadius: "50%",
        objectFit: "cover",
        display: "inline-block",
      }}
    />
  );
}
