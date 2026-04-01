import axios from 'axios';
import { emitSessionExpired, SESSION_EXPIRY_REASONS } from '../utils/sessionExpiry';
import { hasActiveAuthenticatedSession, setAuthenticatedSession } from '../utils/authSessionState';

// Dynamically determine the API URL
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5000/api`
  : "https://apitest2.tuman.web.id/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestConfig = error.config || {};
    if (requestConfig.skipSessionExpiryHandling) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code;
    const hasSession = hasActiveAuthenticatedSession();

    if (status === 401 && hasSession && (code === 'SESSION_REPLACED' || code === 'SESSION_IDLE_TIMEOUT' || code === 'SESSION_INVALID')) {
      setAuthenticatedSession(false);

      emitSessionExpired({
        reason: code || SESSION_EXPIRY_REASONS.SESSION_INVALID,
        title: error.response?.data?.title,
        message: error.response?.data?.message
      });
    }

    if (status === 401 && hasSession && !code) {
      setAuthenticatedSession(false);

      emitSessionExpired({
        reason: SESSION_EXPIRY_REASONS.SESSION_INVALID
      });
    }

    return Promise.reject(error);
  }
);

export default api;
