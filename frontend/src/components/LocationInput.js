import React, { useState, useCallback, useRef, useEffect } from 'react';

// Simple in-memory cache to avoid re-fetching same queries
const suggestionCache = new Map();

// Popular US cities for instant offline suggestions (shown before API responds)
const US_QUICK_CITIES = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'Indianapolis, IN', 'San Francisco, CA', 'Seattle, WA', 'Denver, CO', 'Nashville, TN',
  'Oklahoma City, OK', 'El Paso, TX', 'Washington, DC', 'Las Vegas, NV', 'Louisville, KY',
  'Memphis, TN', 'Portland, OR', 'Baltimore, MD', 'Milwaukee, WI', 'Albuquerque, NM',
  'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA', 'Atlanta, GA', 'Kansas City, MO',
  'Omaha, NE', 'Miami, FL', 'Tampa, FL', 'Orlando, FL', 'Cleveland, OH',
  'Minneapolis, MN', 'Detroit, MI', 'Salt Lake City, UT', 'Boston, MA', 'Pittsburgh, PA',
  'Newark, NJ', 'Raleigh, NC', 'Buffalo, NY', 'Richmond, VA', 'Cincinnati, OH',
  'St. Louis, MO', 'Birmingham, AL', 'Baton Rouge, LA', 'New Orleans, LA', 'Laredo, TX',
  'Lubbock, TX', 'Norfolk, VA', 'Madison, WI', 'Durham, NC', 'Lincoln, NE',
  'Greensboro, NC', 'Anchorage, AK', 'Plano, TX', 'Henderson, NV', 'St. Paul, MN',
  'Riverside, CA', 'Bakersfield, CA', 'Stockton, CA', 'Corpus Christi, TX', 'Toledo, OH',
  'Aurora, CO', 'St. Petersburg, FL', 'Lexington, KY', 'Jersey City, NJ', 'Chandler, AZ',
  'Scottsdale, AZ', 'Reno, NV', 'Honolulu, HI', 'Chula Vista, CA', 'Fort Wayne, IN',
  'Winston-Salem, NC', 'Hialeah, FL', 'Garland, TX', 'Laredo, TX', 'Spokane, WA',
  'Fremont, CA', 'Long Beach, CA', 'Anaheim, CA', 'Santa Ana, CA', 'Boise, ID',
  'Chesapeake, VA', 'Birmingham, AL', 'Shreveport, LA', 'Fayetteville, AR', 'Tacoma, WA',
];

function getQuickMatches(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return US_QUICK_CITIES
    .filter(c => c.toLowerCase().startsWith(q) || c.toLowerCase().split(',')[0].startsWith(q))
    .slice(0, 5)
    .map(c => ({ display_name: c, place_id: `quick_${c}` }));
}

async function fetchNominatim(query) {
  const cacheKey = query.toLowerCase().trim();
  if (suggestionCache.has(cacheKey)) return suggestionCache.get(cacheKey);

  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&countrycodes=us&limit=8&addressdetails=1`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en-US', 'User-Agent': 'ELDTripPlanner/1.0' },
  });
  const data = await res.json();

  const results = data.map(item => ({
    display_name: formatAddress(item),
    place_id: item.place_id,
    lat: item.lat,
    lon: item.lon,
    type: item.type,
  }));

  suggestionCache.set(cacheKey, results);
  // Evict cache if too large
  if (suggestionCache.size > 200) {
    const firstKey = suggestionCache.keys().next().value;
    suggestionCache.delete(firstKey);
  }
  return results;
}

function formatAddress(item) {
  const a = item.address || {};
  const city = a.city || a.town || a.village || a.county || '';
  const state = a.state || '';
  const name = item.name || '';
  if (name && city && state) {
    if (name.toLowerCase() === city.toLowerCase()) return `${city}, ${state}`;
    return `${name}, ${city}, ${state}`;
  }
  if (city && state) return `${city}, ${state}`;
  return item.display_name?.split(',').slice(0, 3).join(',') || '';
}

export default function LocationInput({ label, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    onChange(val);
    setHighlighted(-1);

    // Show quick offline matches instantly (no delay)
    const quick = getQuickMatches(val);
    setQuickSuggestions(quick);

    if (val.length >= 1) {
      setShowDrop(true);
    } else {
      setShowDrop(false);
      setSuggestions([]);
      setQuickSuggestions([]);
      return;
    }

    // Cancel previous timer and fetch
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current = false;

    if (val.length < 2) return;

    // Fetch from Nominatim after 150ms (very fast debounce)
    timerRef.current = setTimeout(async () => {
      const thisAbort = {};
      abortRef.current = thisAbort;
      setLoading(true);
      try {
        const results = await fetchNominatim(val);
        if (abortRef.current !== thisAbort) return; // stale
        // Merge quick + API, dedupe by display_name
        const seen = new Set(quick.map(q => q.display_name));
        const merged = [...quick, ...results.filter(r => !seen.has(r.display_name))];
        setSuggestions(merged);
      } catch {
        // Keep quick results on error
      } finally {
        setLoading(false);
      }
    }, 150);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    const allItems = suggestions.length > 0 ? suggestions : quickSuggestions;
    if (!showDrop || allItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectItem(allItems[highlighted]);
    } else if (e.key === 'Escape') {
      setShowDrop(false);
    }
  }, [showDrop, suggestions, quickSuggestions, highlighted]);

  const selectItem = (item) => {
    onChange(item.display_name);
    setShowDrop(false);
    setSuggestions([]);
    setQuickSuggestions([]);
    setHighlighted(-1);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current = null;
  };

  const displayItems = suggestions.length > 0 ? suggestions : quickSuggestions;

  return (
    <div className="form-group" ref={wrapperRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div className="form-input-with-icon" style={{ position: 'relative' }}>
        {/* Pin icon left */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: '#3b82f6', pointerEvents: 'none' }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (value.length >= 1 && displayItems.length > 0) setShowDrop(true); }}
          placeholder={placeholder || 'City, State or full address'}
          autoComplete="off"
          spellCheck={false}
          style={{ paddingLeft: 36, paddingRight: 36 }}
        />
        {/* Loading / chevron right */}
        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {loading ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
              </path>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDrop && displayItems.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1000,
          marginTop: 4,
          overflow: 'hidden',
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {displayItems.length === 0 && !loading && (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>No results found</div>
          )}
          {displayItems.map((item, idx) => {
            const isQuick = item.place_id?.toString().startsWith('quick_');
            return (
              <div key={item.place_id || idx}
                onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                onMouseEnter={() => setHighlighted(idx)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: highlighted === idx ? '#f0f7ff' : '#fff',
                  borderBottom: idx < displayItems.length - 1 ? '1px solid #f8fafc' : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.1s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={highlighted === idx ? '#3b82f6' : '#94a3b8'} strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    {item.display_name}
                  </div>
                  {isQuick && (
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Quick suggestion</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
