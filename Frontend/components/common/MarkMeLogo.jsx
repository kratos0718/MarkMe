import React from "react";

/* MarkMe Logo — SVG recreation of the circular clock/GPS-pin icon */
const MarkMeLogo = ({ size = 48, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, ...style }}
  >
    <defs>
      <radialGradient id="mm-bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1a0533" />
        <stop offset="100%" stopColor="#08000f" />
      </radialGradient>
      <radialGradient id="mm-face" cx="42%" cy="38%" r="60%">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="55%" stopColor="#5b21b6" />
        <stop offset="100%" stopColor="#1e0547" />
      </radialGradient>
      <linearGradient id="mm-pin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <filter id="mm-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Outer dark background */}
    <circle cx="60" cy="60" r="58" fill="url(#mm-bg)" />

    {/* Concentric rings */}
    <circle cx="60" cy="60" r="54" fill="none" stroke="#4c1d95" strokeWidth="0.8" opacity="0.5" />
    <circle cx="60" cy="60" r="47" fill="none" stroke="#6d28d9" strokeWidth="0.8" opacity="0.4" />
    <circle cx="60" cy="60" r="40" fill="none" stroke="#7c3aed" strokeWidth="0.7"
      strokeDasharray="4 5" opacity="0.35" />

    {/* Clock face */}
    <circle cx="55" cy="56" r="27" fill="url(#mm-face)" />

    {/* Subtle dashed line across clock face */}
    <line x1="31" y1="56" x2="79" y2="56"
      stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />

    {/* White checkmark */}
    <path d="M 42 55 L 51 65 L 69 44"
      stroke="white" strokeWidth="4.5" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      filter="url(#mm-glow)" />

    {/* GPS pin (teardrop) */}
    <path d="M 74 63 C 74 52 89 52 89 63 C 89 71 81.5 80 81.5 80 C 81.5 80 74 71 74 63 Z"
      fill="url(#mm-pin)" />
    {/* Pin inner white dot */}
    <circle cx="81.5" cy="62" r="4.5" fill="white" opacity="0.9" />

    {/* Decorative accent dots */}
    <circle cx="37" cy="35" r="2.5" fill="#22d3ee" opacity="0.9" />   {/* cyan */}
    <circle cx="79" cy="31" r="2"   fill="#fbbf24" opacity="0.9" />   {/* gold */}
    <circle cx="27" cy="63" r="1.8" fill="#ec4899" opacity="0.85" />  {/* pink */}
    <circle cx="87" cy="49" r="1.5" fill="#c4b5fd" opacity="0.6" />   {/* lavender */}
    <circle cx="51" cy="90" r="1.5" fill="#34d399" opacity="0.45" />  {/* green */}
  </svg>
);

export default MarkMeLogo;
