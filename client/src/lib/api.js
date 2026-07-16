import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Preconfigured Axios instance with auth interceptors.
 * - Automatically attaches JWT token from localStorage
 * - Handles 401 responses by clearing auth and redirecting to login
 * - Shows toast notifications on errors
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // Increased to 2 minutes for long-running AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl ? apiUrl.replace(/\/api$/, '') : 'http://localhost:5000';
};

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
