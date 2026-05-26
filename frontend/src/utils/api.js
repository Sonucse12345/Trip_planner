import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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
    }
  }
  
  return config;
});

// Response interceptor: Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optionally: Clear user state and redirect to login
      console.warn('Unauthorized: Please log in again');
      // Redirect to login if needed
      // window.location.href = '/login';
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
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getUser: () => api.get('/auth/user/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
};

/**
 * Trip Planning API endpoints
 */
export const tripAPI = {
  planTrip: (data) => api.post('/trips/plan/', data),
  getTrip: (tripId) => api.get(`/trips/${tripId}/`),
  listTrips: () => api.get('/trips/'),
};

/**
 * Geocoding API endpoints
 */
export const geocodeAPI = {
  search: (query) => api.get('/geocode/', { params: { q: query } }),
};

/**
 * Report/Email API endpoints
 */
export const reportAPI = {
  sendReport: (data) => api.post('/trips/send-report/', data),
};

/**
 * Dashboard API endpoints
 */
export const dashboardAPI = {
  getData: () => api.get('/dashboard/'),
};

export default api;
