import React from "react";

export function BrandLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon
        points="22,6 42,6 58,22 58,42 42,58 22,58 6,42 6,22"
        stroke="#F4F4F5"
        strokeWidth="2"
      />
      <line
        x1="32"
        y1="2"
        x2="32"
        y2="23"
        stroke="#F4F4F5"
        strokeWidth="1.75"
      />
      <line
        x1="32"
        y1="41"
        x2="32"
        y2="62"
        stroke="#F4F4F5"
        strokeWidth="1.75"
      />
      <path
        d="M12 32C17.5 23 24.5 19 32 19C39.5 19 46.5 23 52 32C46.5 41 39.5 45 32 45C24.5 45 17.5 41 12 32Z"
        stroke="#F4F4F5"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="32"
        r="9"
        stroke="#F4F4F5"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />
      <polygon points="32,26 36,32 32,38 28,32" fill="#DC2626" />
    </svg>
  );
}
