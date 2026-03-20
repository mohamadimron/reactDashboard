import axios from 'axios';

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
    if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_REPLACED') {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch custom event for real-time UI notification
      window.dispatchEvent(new CustomEvent('session-replaced', { 
        detail: { message: error.response.data.message } 
      }));
      
      // Redirect will be handled by context/app logic or the popup
    }
    return Promise.reject(error);
  }
);

export default api;
