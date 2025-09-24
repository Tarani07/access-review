import React from 'react';

interface SurveySparrowLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function SurveySparrowLogo({ 
  className = "", 
  width = 32, 
  height = 32 
}: SurveySparrowLogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Arrow Curve */}
      <path 
        d="M15 50 A35 35 0 1 1 85 50 A35 35 0 0 1 75 25 L65 35 A20 20 0 1 0 65 65 L75 75 A35 35 0 0 1 15 50 Z" 
        fill="#5DADE2" 
        opacity="0.8"
      />
      
      {/* Main Circle with Checkmark */}
      <circle 
        cx="50" 
        cy="50" 
        r="28" 
        fill="#2E8B8B" 
      />
      
      {/* Checkmark */}
      <path 
        d="M38 50 L46 58 L66 38" 
        stroke="white" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Arrow tip */}
      <path 
        d="M70 20 L85 25 L80 35 Z" 
        fill="#2E8B8B"
      />
    </svg>
  );
}
