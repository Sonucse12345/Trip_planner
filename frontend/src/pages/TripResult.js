import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TripMap from '../components/TripMap';
import ELDGrid from '../components/ELDGrid';

export default function TripResult({ tripData }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('map');
  const [currentLogDay, setCurrentLogDay] = useState(0);

  if (!tripData) {
    return (
      <>
        <div className="page-header"><h2>Trip Results</h2></div>
        <div className="page-content">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <h3 style={{ color: '#475569', marginBottom: 8 }}>No Trip Data</h3>
              <p style={{ color: '#94a3b8', marginBottom: 20 }}>Plan a new trip to see results here</p>
              <button className="btn btn-primary" onClick={() => navigate('/plan')}>Plan a Trip</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const dailyLogs = tripData.daily_logs || [];
  const stops = tripData.stops || [];
  const compliance = tripData.compliance || {};
  const tripDetails = tripData.trip_details || {};

  const stopTypeConfig = {
    pickup:  { label: 'Pickup',      color: '#16a34a', bg: '#dcfce7', icon: '📦' },
    dropoff: { label: 'Dropoff',     color: '#2563eb', bg: '#dbeafe', icon: '🏁' },
    fuel:    { label: 'Fuel Stop',   color: '#d97706', bg: '#fef3c7', icon: '⛽' },
    rest:    { label: 'Rest',        color: '#7c3aed', bg: '#f3e8ff', icon: '💤' },
    break:   { label: '30-min Break',color: '#0891b2', bg: '#cffafe', icon: '☕' },
    start:   { label: 'Start',       color: '#374151', bg: '#f1f5f9', icon: '🚦' },
    end:     { label: 'End',         color: '#374151', bg: '#f1f5f9', icon: '🏆' },
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Trip Results</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            ID: {tripData.trip_id?.substring(0, 8)}… &nbsp;|&nbsp; {tripData.total_miles?.toFixed(1)} mi &nbsp;|&nbsp; {tripData.total_duration_hours?.toFixed(1)} hrs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/logs')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Full ELD Logs
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Compliance Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>
          {[
            { icon: '🚛', label: 'Driving Hours', value: `${(compliance.total_driving_hours || 0).toFixed(1)}h`, color: 'green' },
            { icon: '📍', label: 'Total Miles', value: (compliance.total_miles || 0).toFixed(0), color: 'blue' },
            { icon: '💤', label: 'Rest Stops', value: compliance.num_rest_stops || 0, color: 'purple' },
            { icon: '⛽', label: 'Fuel Stops', value: compliance.num_fuel_stops || 0, color: 'amber' },
            { icon: '☕', label: '30-min Breaks', value: compliance.num_breaks || 0, color: 'teal' },
            { icon: '⏳', label: 'Cycle Remaining', value: `${(compliance.cycle_hours_remaining || 0).toFixed(1)}h`, color: 'red' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: 20 }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {compliance.warnings && compliance.warnings.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {compliance.warnings.map((w, i) => (
              <div key={i} className="alert alert-warning">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div><strong>{w.rule}:</strong> {w.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs no-print">
          {[
            { id: 'map', label: 'Route Map' },
            { id: 'logs', label: `ELD Logs (${dailyLogs.length} days)` },
            { id: 'stops', label: `Stops (${stops.length})` },
            { id: 'compliance', label: 'FMCSA Rules' },
          ].map(t => (
            <button key={t.id} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <TripMap
                currentCoords={tripData.current_coords}
                pickupCoords={tripData.pickup_coords}
                dropoffCoords={tripData.dropoff_coords}
                routeGeometry={tripData.route_geometry}
                stops={stops}
              />
            </div>
          </div>
        )}

        {/* ELD Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <div className="log-pagination no-print" style={{ marginBottom: 20 }}>
              <button onClick={() => setCurrentLogDay(d => Math.max(0, d - 1))} disabled={currentLogDay === 0}>← Prev</button>
              {dailyLogs.map((dl, idx) => (
                <button key={idx} className={currentLogDay === idx ? 'active' : ''} onClick={() => setCurrentLogDay(idx)}>
                  Day {dl.day_number}
                  <small style={{ display: 'block', fontSize: 10 }}>{dl.date}</small>
                </button>
              ))}
              <button onClick={() => setCurrentLogDay(d => Math.min(dailyLogs.length - 1, d + 1))} disabled={currentLogDay === dailyLogs.length - 1}>Next →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <ELDGrid
                entries={dailyLogs[currentLogDay]?.entries || []}
                dayLog={dailyLogs[currentLogDay]}
                tripDetails={tripDetails}
              />
            </div>
          </div>
        )}

        {/* Stops Tab */}
        {activeTab === 'stops' && (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              {stops.map((stop, i) => {
                const cfg = stopTypeConfig[stop.type] || stopTypeConfig.start;
                const arrival = new Date(stop.arrival).toLocaleString();
                const departure = stop.departure ? new Date(stop.departure).toLocaleString() : '—';
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 16, padding: '16px 20px',
                    borderBottom: i < stops.length - 1 ? '1px solid #f1f5f9' : 'none',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, flexShrink: 0,
                    }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{stop.location}</span>
                        <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 16 }}>
                        <span>Arrival: {arrival}</span>
                        <span>Departure: {departure}</span>
                        <span>Duration: {stop.duration_hours.toFixed(2)}h</span>
                      </div>
                      {stop.remarks && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{stop.remarks}</div>}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>Stop #{i + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FMCSA Rules Tab — Attractive */}
        {activeTab === 'compliance' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #0284c7 100%)',
              padding: '22px 28px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: 0 }}>
                  FMCSA Part 395 — Hours of Service Rules Applied
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '4px 0 0' }}>
                  Federal Motor Carrier Safety Administration · Property-Carrying Drivers · 70-Hr/8-Day Cycle
                </p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
                  ✓ Compliant
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { icon: '⏱️', rule: '§395.3(a)(2)', title: '14-Hour Driving Window', desc: 'No driving allowed after 14 consecutive on-duty hours. Clock starts at first on-duty moment and cannot be extended by breaks.', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                { icon: '🚛', rule: '§395.3(a)(3)', title: '11-Hour Driving Limit', desc: 'Maximum 11 cumulative driving hours within the 14-hour window per on-duty period. Short-haul exception does not apply here.', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                { icon: '☕', rule: '§395.3(a)(3)(ii)', title: '30-Minute Rest Break', desc: 'Required after 8 cumulative driving hours without a break. Must be off-duty or sleeper berth — not on-duty time.', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                { icon: '📅', rule: '§395.3(b)', title: '70-Hour / 8-Day Cycle', desc: 'Rolling 70-hour on-duty limit across 8 consecutive days. Hours from 9 days ago drop off daily. Remaining: ' + (compliance.cycle_hours_remaining || 0).toFixed(1) + 'h.', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
                { icon: '🔄', rule: '§395.3(c)', title: '34-Hour Restart', desc: '34 consecutive off-duty or sleeper berth hours fully resets the 70-hour/8-day cycle counter back to zero hours.', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
                { icon: '💤', rule: 'Standard Reset', title: '10-Hour Off-Duty Reset', desc: '10 consecutive off-duty hours reset both the 11-hour driving limit and the 14-hour window. Required between duty periods.', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                { icon: '⛽', rule: 'Operational', title: 'Fueling Every 1,000 Miles', desc: `On-duty (not driving) stop required every 1,000 miles. Duration: 30 min/stop. This trip required ${compliance.num_fuel_stops || 0} fuel stop(s).`, color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
                { icon: '📦', rule: 'Operational', title: 'Pickup — 1 Hour On Duty', desc: 'Each pickup location counts as 1 hour of on-duty (not driving) time for loading, inspection, and documentation.', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
                { icon: '🏁', rule: 'Operational', title: 'Drop-off — 1 Hour On Duty', desc: 'Each delivery location counts as 1 hour of on-duty (not driving) time for unloading, inspection, and delivery confirmation.', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '20px 22px',
                  borderBottom: i < 6 ? '1px solid #e2e8f0' : 'none',
                  borderRight: (i + 1) % 3 !== 0 ? '1px solid #e2e8f0' : 'none',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: item.bg, border: `1.5px solid ${item.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: item.color, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 3 }}>{item.rule}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 5, lineHeight: 1.3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Banner */}
            <div style={{
              background: 'linear-gradient(90deg, #0f172a, #1e293b)',
              padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 24 }}>✅</div>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                  All HOS rules have been automatically applied to this trip plan.
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  Logs are ready for submission to your carrier. Retain a copy for 7 consecutive days per FMCSA regulation.
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', textAlign: 'right' }}>
                Driving: {(compliance.total_driving_hours || 0).toFixed(2)}h &nbsp;·&nbsp;
                On Duty: {(compliance.total_on_duty_hours || 0).toFixed(2)}h &nbsp;·&nbsp;
                Cycle Used: {(compliance.cycle_hours_used || 0).toFixed(2)}h
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
