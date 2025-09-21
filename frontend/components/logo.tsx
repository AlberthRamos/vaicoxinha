import React from 'react';

export const Logo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={`w-12 h-12 ${className}`}
  >
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#grad1)" stroke="#D2691E" strokeWidth="4" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize="40"
      fontWeight="bold"
      fill="#D2691E"
      transform="rotate(10 50 50)"
    >
      V
    </text>
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize="40"
      fontWeight="bold"
      fill="#FFF"
      transform="rotate(-10 50 50) translate(5, 5)"
    >
      C
    </text>
  </svg>
);
