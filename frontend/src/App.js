import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import TripResult from './pages/TripResult';
import LogViewer from './pages/LogViewer';
import TripHistory from './pages/TripHistory';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { authAPI } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState(null);

  useEffect(() => {
    authAPI.getUser()
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span className="loading-text">Loading ELD Trip Planner...</span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
        <Route
          path="/*"
          element={
            <AppLayout user={user} setUser={setUser} tripData={tripData} setTripData={setTripData} />
          }
        />
      </Routes>
    </Router>
  );
}

function AppLayout({ user, setUser, tripData, setTripData }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} setUser={setUser} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/plan" element={<TripPlanner user={user} setTripData={setTripData} />} />
          <Route path="/result" element={<TripResult tripData={tripData} user={user} />} />
          <Route path="/logs" element={<LogViewer tripData={tripData} />} />
          <Route path="/history" element={<TripHistory user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
