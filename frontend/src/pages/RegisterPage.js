import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function TruckLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rg1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#rg1)"/>
      <rect x="6" y="22" width="34" height="22" rx="2" fill="white" opacity="0.9"/>
      <rect x="9" y="25" width="28" height="16" rx="1" fill="#1e40af" opacity="0.3"/>
      <text x="23" y="37" textAnchor="middle" fill="white" fontSize="9" fontWeight="800" fontFamily="Arial">ELD</text>
      <rect x="40" y="27" width="19" height="17" rx="2" fill="white" opacity="0.85"/>
      <rect x="43" y="30" width="10" height="8" rx="1" fill="#bfdbfe"/>
      <path d="M40 27 Q44 21 53 21 L59 27 Z" fill="white" opacity="0.7"/>
      <rect x="57" y="17" width="3" height="11" rx="1.5" fill="white" opacity="0.5"/>
      <circle cx="14" cy="46" r="5" fill="#1e293b"/>
      <circle cx="14" cy="46" r="3" fill="#475569"/>
      <circle cx="14" cy="46" r="1" fill="#94a3b8"/>
      <circle cx="26" cy="46" r="5" fill="#1e293b"/>
      <circle cx="26" cy="46" r="3" fill="#475569"/>
      <circle cx="26" cy="46" r="1" fill="#94a3b8"/>
      <circle cx="48" cy="46" r="5" fill="#1e293b"/>
      <circle cx="48" cy="46" r="3" fill="#475569"/>
      <circle cx="48" cy="46" r="1" fill="#94a3b8"/>
      <circle cx="59" cy="32" r="2" fill="#fbbf24"/>
      <circle cx="59" cy="38" r="1.5" fill="#ef4444"/>
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function RegisterPage({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError('');
    try {
      // Get CSRF token first
      await fetch('http://localhost:8000/api/auth/user/', { credentials: 'include' });
      const res = await authAPI.register(form);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object' && errors !== null) {
        const msgs = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
        setError(msgs[0] || 'Registration failed');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <TruckLogo size={64} />
          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.12em' }}>
            ELD TRIP PLANNER
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
          Create Account
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
          Get started with ELD Trip Planner
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="First" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Last" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-input" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Choose a username" required autoComplete="username" />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" required autoComplete="email" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                required minLength={6}
                autoComplete="new-password"
                style={{ paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: showPw ? '#3b82f6' : '#94a3b8', padding: 0, display: 'flex', alignItems: 'center',
                }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 4, fontSize: 15, fontWeight: 700 }}
            disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
                  </path>
                </svg>
                Creating Account…
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-link" style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
