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
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#FF6B35" stroke="#FF5722" strokeWidth="2"/>
      
      {/* Sparrow Body */}
      <ellipse cx="50" cy="55" rx="20" ry="15" fill="#FFFFFF"/>
      
      {/* Sparrow Head */}
      <circle cx="45" cy="40" r="12" fill="#FFFFFF"/>
      
      {/* Sparrow Beak */}
      <path d="M32 38 L28 40 L32 42 Z" fill="#FFA726"/>
      
      {/* Sparrow Eye */}
      <circle cx="42" cy="38" r="2" fill="#2196F3"/>
      
      {/* Sparrow Wing */}
      <ellipse cx="55" cy="50" rx="8" ry="12" fill="#E3F2FD" transform="rotate(-20 55 50)"/>
      
      {/* Sparrow Tail */}
      <ellipse cx="68" cy="60" rx="6" ry="10" fill="#E3F2FD" transform="rotate(30 68 60)"/>
      
      {/* Survey Form Lines */}
      <rect x="20" y="70" width="15" height="2" fill="#2196F3" rx="1"/>
      <rect x="20" y="75" width="12" height="2" fill="#2196F3" rx="1"/>
      <rect x="20" y="80" width="18" height="2" fill="#2196F3" rx="1"/>
      
      {/* Checkmark */}
      <path d="M75 72 L78 75 L85 68" stroke="#4CAF50" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
