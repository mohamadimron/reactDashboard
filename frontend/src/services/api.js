import axios from 'axios';
import { emitSessionExpired, SESSION_EXPIRY_REASONS } from '../utils/sessionExpiry';

// Dynamically determine the API URL
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5000/api`
  : "https://apitest2.tuman.web.id/api";

const api = axios.create({
  baseURL: API_URL,
});

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
    const hasStoredSession = Boolean(localStorage.getItem('token'));

    if (status === 401 && hasStoredSession && (code === 'SESSION_REPLACED' || code === 'SESSION_IDLE_TIMEOUT')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      emitSessionExpired({
        reason: code,
        title: error.response?.data?.title,
        message: error.response?.data?.message
      });
    }

    if (status === 401 && hasStoredSession && !code) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      emitSessionExpired({
        reason: SESSION_EXPIRY_REASONS.SESSION_INVALID
      });
    }

    return Promise.reject(error);
  }
);

export default api;
