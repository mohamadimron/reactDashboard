import axios from 'axios';

// Dynamically determine the API URL
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5000/api`
  : "https://apitest2.tuman.web.id/api";

const api = axios.create({
  baseURL: API_URL,
});

const emitSessionExpired = ({ title, message }) => {
  window.dispatchEvent(new CustomEvent('session-expired', {
    detail: { title, message }
  }));
};

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 && (code === 'SESSION_REPLACED' || code === 'SESSION_IDLE_TIMEOUT')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      emitSessionExpired({
        title: error.response?.data?.title || (code === 'SESSION_REPLACED' ? 'Multiple Login Detected' : 'Session Expired'),
        message: error.response?.data?.message || 'Your session has ended. Please log in again to continue.'
      });
    }
    return Promise.reject(error);
  }
);

export default api;
