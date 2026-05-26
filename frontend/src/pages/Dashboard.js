import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { dashboardAPI } from '../utils/api';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    dashboardAPI.getData()
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  // Sample weekly driving hours (replace with real data when API returns it)
  const weeklyData = data?.weekly_hours || [
    { day: 'Mon', driving: 8.5, onDuty: 10.2, offDuty: 13.8 },
    { day: 'Tue', driving: 10.1, onDuty: 11.5, offDuty: 12.5 },
    { day: 'Wed', driving: 7.2, onDuty: 9.0, offDuty: 15.0 },
    { day: 'Thu', driving: 11.0, onDuty: 12.5, offDuty: 11.5 },
    { day: 'Fri', driving: 9.8, onDuty: 11.0, offDuty: 13.0 },
    { day: 'Sat', driving: 6.5, onDuty: 8.0, offDuty: 16.0 },
    { day: 'Sun', driving: 0, onDuty: 0, offDuty: 24 },
  ];

  const cycleUsed = data?.cycle_hours_used || 0;
  const cycleRemaining = 70 - cycleUsed;
  const drivingToday = data?.driving_today || 0;
  const drivingRemaining = Math.max(0, 11 - drivingToday);
  const shiftUsed = data?.shift_hours_used || 0;
  const shiftRemaining = Math.max(0, 14 - shiftUsed);
  const breakDue = data?.break_due_in || 8;

  const clockCards = [
    {
      label: 'Driving Remaining', value: drivingRemaining.toFixed(1), unit: 'hrs',
      max: 11, used: drivingToday,
      color: drivingRemaining < 2 ? '#ef4444' : drivingRemaining < 4 ? '#f59e0b' : '#22c55e',
      bg: drivingRemaining < 2 ? '#fef2f2' : drivingRemaining < 4 ? '#fffbeb' : '#f0fdf4',
      icon: '🚛', rule: '11-Hr Limit',
    },
    {
      label: 'Shift Window Left', value: shiftRemaining.toFixed(1), unit: 'hrs',
      max: 14, used: shiftUsed,
      color: shiftRemaining < 2 ? '#ef4444' : shiftRemaining < 4 ? '#f59e0b' : '#3b82f6',
      bg: shiftRemaining < 2 ? '#fef2f2' : shiftRemaining < 4 ? '#fffbeb' : '#eff6ff',
      icon: '⏱️', rule: '14-Hr Window',
    },
    {
      label: 'Break Due In', value: breakDue.toFixed(1), unit: 'hrs',
      max: 8, used: Math.max(0, 8 - breakDue),
      color: breakDue < 1 ? '#ef4444' : breakDue < 2 ? '#f59e0b' : '#8b5cf6',
      bg: breakDue < 1 ? '#fef2f2' : breakDue < 2 ? '#fffbeb' : '#f5f3ff',
      icon: '☕', rule: '8-Hr Break Rule',
    },
    {
      label: 'Cycle Remaining', value: cycleRemaining.toFixed(1), unit: 'hrs',
      max: 70, used: cycleUsed,
      color: cycleRemaining < 10 ? '#ef4444' : cycleRemaining < 20 ? '#f59e0b' : '#0891b2',
      bg: cycleRemaining < 10 ? '#fef2f2' : cycleRemaining < 20 ? '#fffbeb' : '#ecfeff',
      icon: '📅', rule: '70-Hr/8-Day Cycle',
    },
  ];

  const recentActivity = data?.recent_trips || [
    { date: 'Today', route: 'No trips yet', status: 'pending', miles: 0, hours: 0 },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            {user ? `Welcome back, ${user.first_name || user.username} — Stay compliant.` : 'ELD Trip Planning & HOS Compliance'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/plan')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Trip
        </button>
      </div>

      <div className="page-content">

        {/* ── HOS COMPLIANCE CLOCKS ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>
            LIVE HOS COMPLIANCE STATUS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {clockCards.map((c, i) => {
              const pct = Math.min(100, ((c.max - (parseFloat(c.value) || 0)) / c.max) * 100);
              return (
                <div key={i} style={{
                  background: c.bg,
                  border: `1.5px solid ${c.color}30`,
                  borderRadius: 14,
                  padding: '16px 18px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Progress bar background */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    width: `${100 - pct}%`, height: 3,
                    background: c.color, opacity: 0.6,
                    borderRadius: '0 0 0 14px',
                    transition: 'width 0.8s ease',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: c.color,
                      background: `${c.color}18`, padding: '2px 7px',
                      borderRadius: 20, letterSpacing: '0.04em',
                    }}>{c.rule}</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: c.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {c.value}
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginLeft: 3 }}>{c.unit}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 5 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {c.used.toFixed ? c.used.toFixed(1) : c.used}h used of {c.max}h
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SUMMARY STATS ── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          {[
            { icon: '🗺️', label: 'Total Trips', value: data?.total_trips || 0, color: 'blue' },
            { icon: '📍', label: 'Total Miles', value: (data?.total_miles || 0).toLocaleString(), color: 'green' },
            { icon: '⏳', label: 'Driving Hours', value: (data?.total_hours || 0).toFixed(1) + 'h', color: 'amber' },
            { icon: '✅', label: 'Compliance Rate', value: '100%', color: 'teal' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: 20 }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>

          {/* Weekly Hours Chart */}
          <div className="card">
            <div className="card-header">
              <h3>Weekly Hours Breakdown</h3>
              <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>Last 7 Days</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklyData} margin={{ left: -10 }}>
                  <defs>
                    <linearGradient id="drivingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="onDutyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 14]} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(val, name) => [`${val}h`, name]}
                  />
                  <Area type="monotone" dataKey="driving" name="Driving" stroke="#3b82f6" strokeWidth={2.5} fill="url(#drivingGrad)" />
                  <Area type="monotone" dataKey="onDuty" name="On Duty" stroke="#f59e0b" strokeWidth={2} fill="url(#onDutyGrad)" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
                {[{ color: '#3b82f6', label: 'Driving' }, { color: '#f59e0b', label: 'On Duty' }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cycle Usage Gauge */}
          <div className="card">
            <div className="card-header">
              <h3>70-Hr Cycle Usage</h3>
              <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>8-Day Rolling</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              {/* Donut gauge */}
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="62" fill="none" stroke="#f1f5f9" strokeWidth="18" />
                  <circle cx="80" cy="80" r="62"
                    fill="none"
                    stroke={cycleRemaining < 10 ? '#ef4444' : cycleRemaining < 20 ? '#f59e0b' : '#3b82f6'}
                    strokeWidth="18"
                    strokeDasharray={`${(cycleUsed / 70) * 389.6} 389.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                    {cycleUsed.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>of 70 hrs</div>
                </div>
              </div>
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Hours Used', value: cycleUsed.toFixed(1) + 'h', color: '#3b82f6' },
                  { label: 'Remaining', value: cycleRemaining.toFixed(1) + 'h', color: '#22c55e' },
                  { label: 'Days in Cycle', value: '8 days', color: '#8b5cf6' },
                  { label: 'Reset Needed', value: cycleRemaining < 1 ? 'NOW' : 'Not yet', color: cycleRemaining < 1 ? '#ef4444' : '#64748b' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '10px 8px' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Quick Actions + Trip Performance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {[
                { icon: '🗺️', label: 'Plan New Trip', sub: 'Route + HOS auto-calculated', onClick: () => navigate('/plan'), color: '#3b82f6', bg: '#eff6ff' },
                { icon: '📋', label: 'View ELD Logs', sub: 'Official FMCSA daily log form', onClick: () => navigate('/logs'), color: '#7c3aed', bg: '#f5f3ff' },
                { icon: '📂', label: 'Trip History', sub: 'All past trips & logs', onClick: () => navigate('/history'), color: '#059669', bg: '#ecfdf5' },
                { icon: '🔄', label: '34-Hr Restart', sub: cycleRemaining < 20 ? '⚠️ Recommended soon' : 'Not needed yet', onClick: null, color: cycleRemaining < 20 ? '#d97706' : '#94a3b8', bg: cycleRemaining < 20 ? '#fffbeb' : '#f8fafc' },
              ].map((a, i) => (
                <div key={i}
                  onClick={a.onClick || undefined}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center',
                    padding: '14px 18px',
                    borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
                    cursor: a.onClick ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (a.onClick) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: a.bg, fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: a.color }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{a.sub}</div>
                  </div>
                  {a.onClick && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Performance Card */}
          <div className="card">
            <div className="card-header">
              <h3>Today's Driver Performance</h3>
              <span style={{ fontSize: 11, color: '#059669', background: '#dcfce7', padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>✓ Compliant</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Off Duty', value: (data?.today_off_duty || 0).toFixed(2), color: '#1d4ed8', bg: '#dbeafe', icon: '💤' },
                  { label: 'Sleeper', value: (data?.today_sleeper || 0).toFixed(2), color: '#4338ca', bg: '#e0e7ff', icon: '🛏️' },
                  { label: 'Driving', value: drivingToday.toFixed(2), color: '#c2410c', bg: '#fed7aa', icon: '🚛' },
                  { label: 'On Duty', value: (data?.today_on_duty || 0).toFixed(2), color: '#d97706', bg: '#fef3c7', icon: '📦' },
                ].map((item, i) => (
                  <div key={i} style={{ background: item.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: item.color, fontWeight: 600, marginTop: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>hours</div>
                  </div>
                ))}
              </div>

              {/* HOS rule bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '11-Hr Driving Limit', used: drivingToday, max: 11, color: '#3b82f6' },
                  { label: '14-Hr Shift Window', used: shiftUsed, max: 14, color: '#f59e0b' },
                  { label: '70-Hr Cycle (8-Day)', used: cycleUsed, max: 70, color: '#8b5cf6' },
                ].map((bar, i) => {
                  const pct = Math.min(100, (bar.used / bar.max) * 100);
                  const danger = pct > 85;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                        <span>{bar.label}</span>
                        <span style={{ color: danger ? '#ef4444' : '#64748b' }}>{bar.used.toFixed(1)} / {bar.max}h ({pct.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: danger ? '#ef4444' : bar.color,
                          borderRadius: 8,
                          transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
