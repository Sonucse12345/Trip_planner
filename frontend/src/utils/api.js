import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getUser: () => api.get('/auth/user/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
};

export const tripAPI = {
  planTrip: (data) => api.post('/trips/plan/', data),
  getTrip: (tripId) => api.get(`/trips/${tripId}/`),
  listTrips: () => api.get('/trips/'),
};

export const geocodeAPI = {
  search: (query) => api.get('/geocode/', { params: { q: query } }),
};

export const reportAPI = {
  sendReport: (data) => api.post('/trips/send-report/', data),
};

export const dashboardAPI = {
  getData: () => api.get('/dashboard/'),
};

export default api;
