import React from 'react';

export default function TruckLogo({ size = 40, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="truckGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d4ed8"/>
            <stop offset="100%" stopColor="#0ea5e9"/>
          </linearGradient>
          <linearGradient id="cabGrad" x1="0" y1="0" x2="40" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb"/>
            <stop offset="100%" stopColor="#1e40af"/>
          </linearGradient>
        </defs>
        {/* Road */}
        <rect x="5" y="60" width="70" height="4" rx="2" fill="#334155" opacity="0.3"/>
        {/* Trailer body */}
        <rect x="5" y="28" width="44" height="30" rx="3" fill="url(#truckGrad)"/>
        {/* Trailer side detail */}
        <rect x="8" y="31" width="38" height="24" rx="2" fill="#1e3a8a" opacity="0.4"/>
        <text x="27" y="47" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial">ELD</text>
        {/* Cab */}
        <rect x="49" y="35" width="26" height="23" rx="3" fill="url(#cabGrad)"/>
        {/* Cab windshield */}
        <rect x="52" y="38" width="16" height="11" rx="2" fill="#bfdbfe" opacity="0.85"/>
        {/* Cab roof */}
        <path d="M49 35 Q54 28 66 28 L75 35 Z" fill="#1d4ed8"/>
        {/* Exhaust pipe */}
        <rect x="72" y="22" width="4" height="14" rx="2" fill="#64748b"/>
        <circle cx="74" cy="21" r="2.5" fill="#94a3b8" opacity="0.6"/>
        {/* Trailer wheels */}
        <circle cx="16" cy="60" r="7" fill="#1e293b"/>
        <circle cx="16" cy="60" r="4" fill="#475569"/>
        <circle cx="16" cy="60" r="1.5" fill="#94a3b8"/>
        <circle cx="30" cy="60" r="7" fill="#1e293b"/>
        <circle cx="30" cy="60" r="4" fill="#475569"/>
        <circle cx="30" cy="60" r="1.5" fill="#94a3b8"/>
        {/* Cab wheels */}
        <circle cx="58" cy="60" r="7" fill="#1e293b"/>
        <circle cx="58" cy="60" r="4" fill="#475569"/>
        <circle cx="58" cy="60" r="1.5" fill="#94a3b8"/>
        {/* Hitch */}
        <rect x="47" y="54" width="4" height="4" rx="1" fill="#334155"/>
        {/* Lights */}
        <circle cx="74" cy="42" r="2.5" fill="#fbbf24"/>
        <circle cx="74" cy="50" r="2" fill="#ef4444"/>
        {/* Trailer stripes */}
        <line x1="5" y1="40" x2="49" y2="40" stroke="white" strokeWidth="1" opacity="0.2"/>
        <line x1="5" y1="48" x2="49" y2="48" stroke="white" strokeWidth="1" opacity="0.2"/>
      </svg>
      {showText && (
        <div>
          <div style={{ fontSize: size * 0.45, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1 }}>ELD Planner</div>
          <div style={{ fontSize: size * 0.22, color: '#94a3b8', letterSpacing: '0.05em', marginTop: 2 }}>FMCSA COMPLIANT</div>
        </div>
      )}
    </div>
  );
}
