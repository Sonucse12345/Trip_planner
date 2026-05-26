import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>),
  },
  {
    path: '/plan',
    label: 'Plan a Trip',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>),
  },
  {
    path: '/result',
    label: 'Trip Results',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>),
  },
  {
    path: '/logs',
    label: 'ELD Logs',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  },
  {
    path: '/history',
    label: 'Trip History',
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  },
];

function TruckLogoSVG() {
  return (
    <svg width="38" height="38" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sidebarTruckGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect x="5" y="28" width="44" height="30" rx="3" fill="url(#sidebarTruckGrad)"/>
      <rect x="8" y="31" width="38" height="24" rx="2" fill="#1e3a8a" opacity="0.35"/>
      <text x="27" y="47" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="Arial">ELD</text>
      <rect x="49" y="35" width="26" height="23" rx="3" fill="#2563eb"/>
      <rect x="52" y="38" width="16" height="11" rx="2" fill="#bfdbfe" opacity="0.85"/>
      <path d="M49 35 Q54 28 66 28 L75 35 Z" fill="#1d4ed8"/>
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

export default function Sidebar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (e) {}
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <TruckLogoSVG />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>ELD Planner</h1>
            <span style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.04em' }}>FMCSA COMPLIANT</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 4px', margin: '8px 12px 0', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
        <div style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2 }}>FMCSA PART 395</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>70-Hr/8-Day HOS</div>
      </div>

      <nav className="sidebar-nav" style={{ marginTop: 12 }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, padding: '0 12px' }}>
              Signed in as <strong style={{ color: '#e2e8f0' }}>{user.username}</strong>
            </div>
            <button className="nav-item" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="nav-item" onClick={() => navigate('/login')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
