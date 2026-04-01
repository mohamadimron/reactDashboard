const AUTH_SESSION_HINT_COOKIE_NAME = 'rd_session_hint';
const ONE_DAY_SECONDS = 24 * 60 * 60;

export const hasAuthSessionHint = () => {
  if (typeof document === 'undefined') return false;

  return document.cookie
    .split(';')
    .some((cookiePart) => cookiePart.trim().startsWith(`${AUTH_SESSION_HINT_COOKIE_NAME}=`));
};

export const setAuthSessionHint = () => {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  document.cookie = [
    `${AUTH_SESSION_HINT_COOKIE_NAME}=1`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${ONE_DAY_SECONDS}`,
    isSecure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
};

export const clearAuthSessionHint = () => {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  document.cookie = [
    `${AUTH_SESSION_HINT_COOKIE_NAME}=`,
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
    isSecure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
};
