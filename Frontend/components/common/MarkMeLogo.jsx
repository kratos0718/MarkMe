import React from "react";

/* MarkMe logo — clean rounded badge with a checkmark */
const MarkMeLogo = ({ size = 40, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, ...style }}
    role="img"
    aria-label="MarkMe"
  >
    <rect x="2" y="2" width="44" height="44" rx="12" fill="#4f46e5" />
    <path
      d="M13 24.5 L20.5 32 L35 16"
      fill="none"
      stroke="#ffffff"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MarkMeLogo;
