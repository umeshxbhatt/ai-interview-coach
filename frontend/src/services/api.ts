import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial to send/receive cookies automatically
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response interceptor for automatic silent token refresh on 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard against infinite refresh loops, logins, or non-401 errors
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup')
    ) {
      return Promise.reject(error);
    }

    // Handle token refresh rotation
    if (originalRequest.url?.includes('/auth/refresh')) {
      // If the refresh call itself fails, clean state and reject
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue requests while refreshing is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Trigger silent session refresh
      await api.post('/auth/refresh');
      processQueue(null);
      isRefreshing = false;
      
      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      
      // Clear client state (optionally trigger store logout)
      // Custom event to alert state stores of forced logout
      window.dispatchEvent(new Event('auth-logout-required'));
      
      return Promise.reject(refreshError);
    }
  }
);
