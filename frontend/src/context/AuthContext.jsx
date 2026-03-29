import { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { emitSessionExpired, resetSessionExpiryNotice, SESSION_EXPIRY_REASONS } from '../utils/sessionExpiry';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const INACTIVITY_LIMIT = 30 * 60 * 1000; 

  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_LIMIT);
    }
  };

  const handleAutoLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    emitSessionExpired({
      reason: SESSION_EXPIRY_REASONS.FRONTEND_INACTIVITY_TIMEOUT
    });
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Listen for user activity to reset timer
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
      
      const handleActivity = () => resetInactivityTimer();
      
      events.forEach(event => window.addEventListener(event, handleActivity));
      resetInactivityTimer(); // Start timer on login

      return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, ...userData } = response.data;
    resetSessionExpiryNotice();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, ...userData } = response.data;
    resetSessionExpiryNotice();
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetSessionExpiryNotice();
    setUser(null);
  };

  const updateUserContext = (newData) => {
    const updatedUser = { ...user, ...newData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUserContext }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
