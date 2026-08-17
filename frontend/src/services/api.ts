import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s (e.g. token expiration) globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If the API returns a 401 Unauthorized, we log the user out.
    // In the future, this is where a silent refresh token mechanism would go.
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
      // Redirect to login handled at router level usually by observing isAuthenticated
    }
    return Promise.reject(error);
  }
);
