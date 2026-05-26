import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ✅ Fix default marker icons for production
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 32px; height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; color: white;
    "><span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const icons = {
  start: createIcon('#3b82f6', 'S'),
  pickup: createIcon('#22c55e', 'P'),
  dropoff: createIcon('#a855f7', 'D'),
  fuel: createIcon('#f59e0b', '⛽'),
  rest: createIcon('#1e293b', 'R'),
  break: createIcon('#14b8a6', '☕'),
};

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 12,
        });
      } catch (err) {
        console.error('❌ Error fitting bounds:', err);
      }
    }
  }, [map, bounds]);
  return null;
}

export default function TripMap({ routeGeometry, stops, currentCoords, pickupCoords, dropoffCoords }) {
  const [mapReady, setMapReady] = useState(false);

  const routeCoords = [];
  if (routeGeometry && routeGeometry.coordinates) {
    routeGeometry.coordinates.forEach((coord) => {
      routeCoords.push([coord[1], coord[0]]);
    });
  }

  const bounds = [];
  if (currentCoords) bounds.push(currentCoords);
  if (pickupCoords) bounds.push(pickupCoords);
  if (dropoffCoords) bounds.push(dropoffCoords);
  if (stops) {
    stops.forEach((s) => {
      if (s.latitude && s.longitude) bounds.push([s.latitude, s.longitude]);
    });
  }

  const center = bounds.length > 0 ? bounds[0] : [39.8283, -98.5795];

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="map-container" style={{ 
        height: '500px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="map-container" 
      style={{ 
        height: '500px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* ✅ Use CartoDB Light tiles (more reliable than OSM) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />

        {bounds.length > 1 && <FitBounds bounds={bounds} />}

        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ 
              color: '#3b82f6', 
              weight: 4, 
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {currentCoords && currentCoords[0] !== 0 && (
          <Marker position={currentCoords} icon={icons.start}>
            <Popup><strong>🚦 Start Location</strong></Popup>
          </Marker>
        )}

        {pickupCoords && pickupCoords[0] !== 0 && (
          <Marker position={pickupCoords} icon={icons.pickup}>
            <Popup><strong>📦 Pickup Location</strong></Popup>
          </Marker>
        )}

        {dropoffCoords && dropoffCoords[0] !== 0 && (
          <Marker position={dropoffCoords} icon={icons.dropoff}>
            <Popup><strong>🏁 Dropoff Location</strong></Popup>
          </Marker>
        )}

        {stops && stops.map((stop, idx) => (
          stop.latitude && stop.longitude && stop.type !== 'pickup' && stop.type !== 'dropoff' ? (
            <Marker
              key={idx}
              position={[stop.latitude, stop.longitude]}
              icon={icons[stop.type] || icons.rest}
            >
              <Popup>
                <div>
                  <strong>{stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}</strong>
                  <br />
                  <small>{stop.location}</small>
                  <br />
                  <small style={{ color: '#666' }}>
                    Duration: {stop.duration_hours?.toFixed(1)} hrs
                  </small>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
