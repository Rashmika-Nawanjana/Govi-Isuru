import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios response interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors that are token-related
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;
      const errorMsg = error.response?.data?.error || error.response?.data?.msg || '';

      // Check if it's a token expiry or invalid token issue
      const isTokenError = errorCode === 'TOKEN_EXPIRED' ||
        errorMsg.includes('expired') ||
        errorMsg.includes('Invalid token') ||
        errorMsg.includes('Token is not valid');

      if (!isTokenError) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token - user needs to re-login
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE}/api/auth/refresh-token`, {
          refreshToken
        });

        const newToken = response.data.accessToken || response.data.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }

          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          processQueue(null, newToken);
          return axios(originalRequest);
        } else {
          processQueue(new Error('No token in refresh response'));
          handleLogout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Dispatch event so App.js can pick it up and reset state
  window.dispatchEvent(new CustomEvent('session-expired'));
}

export default axios;
