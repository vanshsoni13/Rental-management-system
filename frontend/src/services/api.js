import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied to http://localhost:5000/api by Vite
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rental_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('rental_token');
      localStorage.removeItem('rental_user');
    }
    return Promise.reject(error);
  }
);

export default api;
