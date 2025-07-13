import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get Firebase Auth token
    const { auth } = await import('./firebase');
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { auth } = await import('./firebase');
      await auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;