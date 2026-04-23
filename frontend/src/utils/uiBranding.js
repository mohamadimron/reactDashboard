import api, { API_URL } from '../services/api';
import { logFrontendError } from './frontendLogger';

const DEFAULT_TITLE = 'React Dashboard';
const DEFAULT_FAVICON = '/favicon.svg';

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

export const applyUiBranding = ({ websiteTitle, websiteFaviconUrl } = {}) => {
  document.title = String(websiteTitle || '').trim() || DEFAULT_TITLE;

  let faviconEl = document.querySelector('link[rel="icon"]');
  if (!faviconEl) {
    faviconEl = document.createElement('link');
    faviconEl.setAttribute('rel', 'icon');
    document.head.appendChild(faviconEl);
  }

  const faviconUrl = websiteFaviconUrl ? toAbsoluteAssetUrl(websiteFaviconUrl) : DEFAULT_FAVICON;
  faviconEl.setAttribute('type', getFaviconMimeType(faviconUrl));
  faviconEl.setAttribute('href', faviconUrl);
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
    applyUiBranding({
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
