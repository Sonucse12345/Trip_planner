import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('🔌 API Base URL:', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // ✅ CRITICAL: Send cookies with every request for session management
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add CSRF token to all POST, PUT, PATCH, DELETE requests
api.interceptors.request.use((config) => {
  // Try to get CSRF token from meta tag first (modern approach)
  let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  // Fallback: Get from cookie (Django's default)
  if (!csrfToken) {
    csrfToken = getCookie('csrftoken');
  }
  
  // Add CSRF token to requests that modify data
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
      console.log('✅ CSRF token added to request');
    } else {
      console.warn('⚠️ No CSRF token found');
    }
  }
  
  return config;
});

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('✅ Request successful:', response.config.url);
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'unknown';
    const data = error.response?.data || {};
    
    console.error(`❌ Request failed [${status}]: ${url}`, data);
    
    if (status === 401) {
      console.warn('🔐 Unauthorized: Please log in again');
    } else if (status === 403) {
      console.error('🚫 Forbidden: CSRF or permission issue', data);
    } else if (status === 500) {
      console.error('💥 Server error:', data);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper function to extract CSRF token from cookie
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Authentication API endpoints
 */
export const authAPI = {
  register: (data) => {
    console.log('📝 Calling: POST /auth/register/');
    return api.post('/auth/register/', data);
  },
  login: (data) => {
    console.log('🔑 Calling: POST /auth/login/');
    return api.post('/auth/login/', data);
  },
  logout: () => {
    console.log('🚪 Calling: POST /auth/logout/');
    return api.post('/auth/logout/');
  },
  getUser: () => {
    console.log('👤 Calling: GET /auth/user/');
    return api.get('/auth/user/');
  },
  updateProfile: (data) => {
    console.log('✏️ Calling: PUT /auth/profile/');
    return api.put('/auth/profile/', data);
  },
};

/**
 * Trip Planning API endpoints
 */
export const tripAPI = {
  planTrip: (data) => {
    console.log('🗺️ Calling: POST /trips/plan/');
    return api.post('/trips/plan/', data);
  },
  getTrip: (tripId) => {
    console.log(`📍 Calling: GET /trips/${tripId}/`);
    return api.get(`/trips/${tripId}/`);
  },
  listTrips: () => {
    console.log('📋 Calling: GET /trips/');
    return api.get('/trips/');
  },
};

/**
 * Geocoding API endpoints
 */
export const geocodeAPI = {
  search: (query) => {
    console.log(`🔍 Calling: GET /geocode/?q=${query}`);
    return api.get('/geocode/', { params: { q: query } });
  },
};

/**
 * Report/Email API endpoints
 */
export const reportAPI = {
  sendReport: (data) => {
    console.log('📧 Calling: POST /trips/send-report/');
    return api.post('/trips/send-report/', data);
  },
};

/**
 * Dashboard API endpoints
 */
export const dashboardAPI = {
  getData: () => {
    console.log('📊 Calling: GET /dashboard/');
    return api.get('/dashboard/');
  },
};

export default api;
