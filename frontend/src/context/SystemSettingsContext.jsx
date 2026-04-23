import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { API_URL } from '../services/api';

const SystemSettingsContext = createContext();

export const SystemSettingsProvider = ({ children }) => {
  const [siteTitle, setSiteTitle] = useState('React Dashboard');
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateBrowserUI = useCallback((title, favicon) => {
    if (title) {
      document.title = title;
    }
    if (favicon) {
      // Determine the absolute base URL of the backend (e.g., https://apidemo.tuman.web.id)
      const backendBase = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL.replace(/\/api\/$/, '');
      const cleanPath = favicon.startsWith('/') ? favicon : `/${favicon}`;
      const fullFaviconUrl = favicon.startsWith('http') ? favicon : `${backendBase}${cleanPath}`;
      
      // Target all common favicon link types to ensure global consistency
      const selectors = ["link[rel*='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
      
      let found = false;
      selectors.forEach(selector => {
        const links = document.querySelectorAll(selector);
        links.forEach(link => {
          link.href = `${fullFaviconUrl}?t=${Date.now()}`;
          found = true;
        });
      });

      // If no link tag exists at all, create a standard one
      if (!found) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = `${fullFaviconUrl}?t=${Date.now()}`;
        document.head.appendChild(link);
      }
    }
  }, []);

  const fetchPublicSettings = useCallback(async () => {
    try {
      const response = await api.get('/settings/public', { 
        skipSystemErrorLogging: true,
        skipSessionExpiryHandling: true 
      });
      
      const { siteTitle: fetchedTitle, faviconUrl: fetchedFavicon } = response.data || {};
      if (fetchedTitle) setSiteTitle(fetchedTitle);
      if (fetchedFavicon) setFaviconUrl(fetchedFavicon);
      
      updateBrowserUI(fetchedTitle || siteTitle, fetchedFavicon || faviconUrl);
    } catch {
      updateBrowserUI(siteTitle, faviconUrl);
    } finally {
      setLoading(false);
    }
  }, [updateBrowserUI, siteTitle, faviconUrl]);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  const refreshSettings = async () => {
    await fetchPublicSettings();
  };

  return (
    <SystemSettingsContext.Provider value={{ siteTitle, faviconUrl, loading, refreshSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSystemSettings = () => useContext(SystemSettingsContext);
