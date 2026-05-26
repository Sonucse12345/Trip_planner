import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationInput from '../components/LocationInput';
import { tripAPI } from '../utils/api';

export default function TripPlanner({ user, setTripData }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0,
    driver_name: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Driver',
    carrier_name: '',
    main_office_address: '',
    truck_number: '',
    trailer_number: '',
    shipping_doc_number: '',
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.current_location.trim()) return 'Current location is required';
      if (!formData.pickup_location.trim()) return 'Pickup location is required';
      if (!formData.dropoff_location.trim()) return 'Dropoff location is required';
    }
    if (step === 2) {
      if (formData.current_cycle_used < 0) return 'Cycle hours cannot be negative';
      if (formData.current_cycle_used > 70) return 'Cycle hours cannot exceed 70 (FMCSA 70-hr/8-day limit)';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await tripAPI.planTrip({
        ...formData,
        current_cycle_used: parseFloat(formData.current_cycle_used) || 0,
      });
      setTripData(res.data);
      navigate('/result');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to plan trip. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Plan New Trip</h2>
        <span className="compliance-badge success">FMCSA Compliant</span>
      </div>

      <div className="page-content">
        {/* Stepper */}
        <div className="stepper">
          {[
            { num: 1, label: 'Route Details' },
            { num: 2, label: 'HOS & Cycle' },
            { num: 3, label: 'Driver Info' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              {idx > 0 && <div className={`stepper-line ${step > s.num - 1 ? 'completed' : ''}`} />}
              <div className={`stepper-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                <div className="stepper-circle">
                  {step > s.num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className="stepper-label">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '28px' }}>
              {error && (
                <div className="alert alert-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Step 1: Route */}
              {step === 1 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>
                    Enter Route Information
                  </h3>
                  <LocationInput
                    label="Current Location"
                    value={formData.current_location}
                    onChange={(v) => updateField('current_location', v)}
                    placeholder="e.g., Richmond, VA"
                  />
                  <LocationInput
                    label="Pickup Location"
                    value={formData.pickup_location}
                    onChange={(v) => updateField('pickup_location', v)}
                    placeholder="e.g., Washington, DC"
                  />
                  <LocationInput
                    label="Dropoff Location"
                    value={formData.dropoff_location}
                    onChange={(v) => updateField('dropoff_location', v)}
                    placeholder="e.g., Newark, NJ"
                  />
                  <div className="alert alert-info" style={{ marginTop: '16px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Start typing to see location suggestions from OpenStreetMap. Select a suggestion or type your own address.
                  </div>
                </div>
              )}

              {/* Step 2: HOS */}
              {step === 2 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>
                    Hours of Service Configuration
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Current Cycle Used (Hours)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.current_cycle_used}
                      onChange={(e) => updateField('current_cycle_used', e.target.value)}
                      min="0"
                      max="70"
                      step="0.5"
                      placeholder="0"
                    />
                    <div className="form-hint">
                      Hours already used in the 70-hr/8-day rolling cycle (0-70)
                    </div>
                  </div>

                  {/* Cycle progress bar */}
                  <div style={{
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>70-Hour Cycle Usage</span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: formData.current_cycle_used > 60 ? '#ef4444' : '#16a34a',
                      }}>
                        {70 - (parseFloat(formData.current_cycle_used) || 0)} hrs remaining
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((parseFloat(formData.current_cycle_used) || 0) / 70) * 100)}%`,
                        background: formData.current_cycle_used > 60
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #22c55e, #3b82f6)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  <div className="alert alert-warning" style={{ marginTop: '16px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <strong>Property-Carrying Driver Rules:</strong><br />
                      11-hr driving limit | 14-hr window | 30-min break after 8hrs | 70-hr/8-day cycle
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Driver Info */}
              {step === 3 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>
                    Driver & Carrier Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Driver Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.driver_name}
                        onChange={(e) => updateField('driver_name', e.target.value)}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Carrier Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.carrier_name}
                        onChange={(e) => updateField('carrier_name', e.target.value)}
                        placeholder="Carrier Company"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Truck Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.truck_number}
                        onChange={(e) => updateField('truck_number', e.target.value)}
                        placeholder="e.g., TRK-1234"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Trailer Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.trailer_number}
                        onChange={(e) => updateField('trailer_number', e.target.value)}
                        placeholder="e.g., TRL-5678"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Main Office Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.main_office_address}
                      onChange={(e) => updateField('main_office_address', e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shipping Document / Bill of Lading #</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.shipping_doc_number}
                      onChange={(e) => updateField('shipping_doc_number', e.target.value)}
                      placeholder="e.g., BOL-2024-001"
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0',
              }}>
                {step > 1 ? (
                  <button className="btn btn-secondary" onClick={prevStep}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Previous
                  </button>
                ) : (
                  <div />
                )}
                {step < 3 ? (
                  <button className="btn btn-primary" onClick={nextStep}>
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                        Planning Route...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                        Generate Trip & ELD Logs
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
