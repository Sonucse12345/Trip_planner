import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI } from '../utils/api';

export default function TripHistory({ user }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripAPI.listTrips()
      .then((res) => setTrips(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Trip History</h2>
        <button className="btn btn-primary" onClick={() => navigate('/plan')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Trip
        </button>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span className="loading-text">Loading trips...</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 style={{ color: '#475569', marginBottom: '8px' }}>No Trips Yet</h3>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Plan your first trip to get started</p>
              <button className="btn btn-primary" onClick={() => navigate('/plan')}>Plan a Trip</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trip ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distance</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} 
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: '#3b82f6' }}>
                        {trip.id?.substring(0, 8)}...
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500 }}>
                        {trip.driver_name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {trip.current_location?.split(',')[0]} → {trip.dropoff_location?.split(',')[0]}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500 }}>
                        {trip.total_distance_miles?.toFixed(0)} mi
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`compliance-badge ${trip.status === 'completed' ? 'success' : trip.status === 'active' ? 'warning' : ''}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8' }}>
                        {new Date(trip.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
