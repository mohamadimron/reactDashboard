import api, { API_URL } from '../services/api';
import { logFrontendError } from './frontendLogger';

const DEFAULT_TITLE = 'React Dashboard';
const DEFAULT_FAVICON = '/favicon.svg';
const UI_BRANDING_STORAGE_KEY = 'react_dashboard_ui_branding';

const getFaviconMimeType = (faviconUrl) => {
  if (faviconUrl?.endsWith('.svg')) return 'image/svg+xml';
  if (faviconUrl?.endsWith('.png')) return 'image/png';
  if (faviconUrl?.endsWith('.webp')) return 'image/webp';
  if (faviconUrl?.endsWith('.jpg') || faviconUrl?.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

const toAbsoluteAssetUrl = (assetPath) => {
  if (!assetPath) return DEFAULT_FAVICON;
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${API_URL}${normalizedPath}`;
};

const persistUiBranding = ({ websiteTitle, websiteFaviconUrl } = {}) => {
  try {
    window.localStorage.setItem(UI_BRANDING_STORAGE_KEY, JSON.stringify({
      websiteTitle: String(websiteTitle || '').trim() || DEFAULT_TITLE,
      websiteFaviconUrl: websiteFaviconUrl || DEFAULT_FAVICON
    }));
  } catch {
    // Ignore storage failures.
  }
};

export const getCachedUiBranding = () => {
  try {
    const rawValue = window.localStorage.getItem(UI_BRANDING_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    return {
      websiteTitle: String(parsed.websiteTitle || '').trim() || DEFAULT_TITLE,
      websiteFaviconUrl: parsed.websiteFaviconUrl || DEFAULT_FAVICON
    };
  } catch {
    return null;
  }
};

export const applyUiBranding = ({ websiteTitle, websiteFaviconUrl } = {}) => {
  const resolvedTitle = String(websiteTitle || '').trim() || DEFAULT_TITLE;
  const resolvedFavicon = websiteFaviconUrl || DEFAULT_FAVICON;

  document.title = resolvedTitle;

  let faviconEl = document.querySelector('link[rel="icon"]');
  if (!faviconEl) {
    faviconEl = document.createElement('link');
    faviconEl.setAttribute('rel', 'icon');
    document.head.appendChild(faviconEl);
  }

  const faviconUrl = toAbsoluteAssetUrl(resolvedFavicon);
  faviconEl.setAttribute('type', getFaviconMimeType(faviconUrl));
  faviconEl.setAttribute('href', faviconUrl);

  persistUiBranding({
    websiteTitle: resolvedTitle,
    websiteFaviconUrl: resolvedFavicon
  });
};

export const fetchAndApplyUiBranding = async () => {
  try {
    const response = await api.get('/settings/public', {
      skipSessionExpiryHandling: true,
      skipSystemErrorLogging: true
    });

    applyUiBranding(response.data);
    return response.data;
  } catch (error) {
    const cachedBranding = getCachedUiBranding();
    applyUiBranding(cachedBranding || {
      websiteTitle: DEFAULT_TITLE,
      websiteFaviconUrl: DEFAULT_FAVICON
    });
    logFrontendError('fetch_ui_branding_failed', error);
    return null;
  }
};

export const getUiAssetUrl = (assetPath) => {
  if (!assetPath) return '';
  return toAbsoluteAssetUrl(assetPath);
};
