import React from 'react';
import { useNavigate } from 'react-router-dom';

function TruckSVG() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect x="5" y="28" width="44" height="30" rx="3" fill="url(#wGrad)"/>
      <rect x="8" y="31" width="38" height="24" rx="2" fill="#1e3a8a" opacity="0.35"/>
      <text x="27" y="47" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="Arial">ELD</text>
      <rect x="49" y="35" width="26" height="23" rx="3" fill="#3b82f6"/>
      <rect x="52" y="38" width="16" height="11" rx="2" fill="#bfdbfe" opacity="0.85"/>
      <path d="M49 35 Q54 28 66 28 L75 35 Z" fill="#2563eb"/>
      <rect x="72" y="22" width="4" height="14" rx="2" fill="#64748b"/>
      <circle cx="74" cy="21" r="2.5" fill="#94a3b8" opacity="0.5"/>
      <circle cx="16" cy="60" r="7" fill="#1e293b"/>
      <circle cx="16" cy="60" r="4" fill="#475569"/>
      <circle cx="16" cy="60" r="1.5" fill="#94a3b8"/>
      <circle cx="30" cy="60" r="7" fill="#1e293b"/>
      <circle cx="30" cy="60" r="4" fill="#475569"/>
      <circle cx="30" cy="60" r="1.5" fill="#94a3b8"/>
      <circle cx="58" cy="60" r="7" fill="#1e293b"/>
      <circle cx="58" cy="60" r="4" fill="#475569"/>
      <circle cx="58" cy="60" r="1.5" fill="#94a3b8"/>
      <rect x="47" y="54" width="4" height="4" rx="1" fill="#334155"/>
      <circle cx="74" cy="42" r="2.5" fill="#fbbf24"/>
      <circle cx="74" cy="50" r="2" fill="#ef4444"/>
    </svg>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40,
    }}>
      <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 100, height: 100, borderRadius: 24,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <TruckSVG />
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 12 }}>
          FMCSA PART 395 COMPLIANT
        </div>

        <h1 style={{
          fontSize: 52, fontWeight: 900, color: 'white',
          letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 12,
        }}>
          ELD Trip Planner
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', marginBottom: 40, lineHeight: 1.6 }}>
          Plan your commercial route with automatic Hours of Service compliance,<br />
          official FMCSA daily logs, and real-time route optimization.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/plan')}
            style={{ fontSize: 16, padding: '14px 36px', background: 'white', color: '#1d4ed8', fontWeight: 800 }}
          >
            Plan a Trip →
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate('/login')}
            style={{ fontSize: 16, padding: '14px 36px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)' }}
          >
            Sign In
          </button>
        </div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🗺️', title: 'Smart Route Planning', desc: 'Real-time routing via OSRM with pickup, dropoff, fuel stops, and rest breaks' },
            { icon: '📋', title: 'Official FMCSA Logs', desc: 'Generates DOT-compliant Driver\'s Daily Logs matching official form format exactly' },
            { icon: '⚖️', title: 'HOS Compliance', desc: 'Automatic 11h/14h/70h rule enforcement with 30-min breaks and cycle tracking' },
          ].map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: '24px 20px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
