import { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../services/api';
import { emitSessionExpired, resetSessionExpiryNotice, SESSION_EXPIRY_REASONS } from '../utils/sessionExpiry';
import { setAuthenticatedSession } from '../utils/authSessionState';
import { clearAuthSessionHint, hasAuthSessionHint, setAuthSessionHint } from '../utils/authSessionHint';

const AuthContext = createContext();
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const handleAutoLogout = useCallback(() => {
    void api.post('/auth/logout', null, {
      skipSessionExpiryHandling: true
    }).catch(() => {});

    setAuthenticatedSession(false);
    setUser(null);

    emitSessionExpired({
      reason: SESSION_EXPIRY_REASONS.FRONTEND_INACTIVITY_TIMEOUT
    });
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_LIMIT);
    }
  }, [handleAutoLogout, user]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setAuthenticatedSession(false);
      clearAuthSessionHint();
      setUser(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const sessionHintExists = hasAuthSessionHint();
      const pathname = window.location.pathname;
      const isAuthScreen = pathname === '/login' || pathname === '/register';

      if (!sessionHintExists && isAuthScreen) {
        if (isMounted) {
          setAuthenticatedSession(false);
          clearAuthSessionHint();
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.get('/auth/me', {
          skipSessionExpiryHandling: true
        });

        if (!isMounted) return;

        setAuthenticatedSession(true);
        setAuthSessionHint();
        setUser(response.data);
      } catch {
        if (!isMounted) return;

        setAuthenticatedSession(false);
        clearAuthSessionHint();
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
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
  }, [resetInactivityTimer, user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    resetSessionExpiryNotice();
    setAuthenticatedSession(true);
    setAuthSessionHint();
    setUser(response.data);
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    resetSessionExpiryNotice();
    setAuthenticatedSession(true);
    setAuthSessionHint();
    setUser(response.data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', null, {
        skipSessionExpiryHandling: true
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }

    setAuthenticatedSession(false);
    clearAuthSessionHint();
    resetSessionExpiryNotice();
    setUser(null);
  };

  const updateUserContext = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUserContext }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
