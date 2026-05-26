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
    /**
     * Initialize app: 
     * 1. Fetch CSRF token from backend (sets csrftoken cookie)
     * 2. Check if user is already authenticated
     */
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing ELD Trip Planner...');
        
        // This GET request will:
        // - Set the CSRF token cookie in the browser
        // - Check if user is authenticated
        const res = await authAPI.getUser();
        
        if (res.data.user) {
          console.log('✅ User is authenticated:', res.data.user.username);
          setUser(res.data.user);
        } else {
          console.log('ℹ️ No user authenticated - showing public dashboard');
        }
      } catch (err) {
        console.error('⚠️ Error during initialization:', err.message);
        // Not a critical error if user is not logged in
        // But log it for debugging CORS issues
        if (err.response?.status === 0 || err.message.includes('CORS')) {
          console.error('🔴 CORS ERROR: Backend is not accepting requests from this frontend');
          console.error('Expected CORS_ALLOWED_ORIGINS to include:', window.location.origin);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
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
