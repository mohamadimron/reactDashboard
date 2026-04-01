const AUTH_COOKIE_NAME = 'rd_session';
const AUTH_SESSION_HINT_COOKIE_NAME = 'rd_session_hint';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getBaseAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  };
};

const getAuthCookieOptions = () => ({
  ...getBaseAuthCookieOptions(),
  maxAge: ONE_DAY_MS
});

const getAuthSessionHintCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_DAY_MS
  };
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.cookie(AUTH_SESSION_HINT_COOKIE_NAME, '1', getAuthSessionHintCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getBaseAuthCookieOptions());
  res.clearCookie(AUTH_SESSION_HINT_COOKIE_NAME, {
    ...getAuthSessionHintCookieOptions(),
    maxAge: undefined
  });
};

const getCookieValue = (req, name) => {
  const rawCookieHeader = req.headers.cookie;
  if (!rawCookieHeader) return null;

  const pairs = rawCookieHeader.split(';');
  for (const pair of pairs) {
    const [rawKey, ...rawValueParts] = pair.trim().split('=');
    if (rawKey !== name) continue;

    const rawValue = rawValueParts.join('=');
    return rawValue ? decodeURIComponent(rawValue) : null;
  }

  return null;
};

const getAuthTokenFromRequest = (req) => {
  const cookieToken = getCookieValue(req, AUTH_COOKIE_NAME);
  if (cookieToken) {
    return cookieToken;
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

module.exports = {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_HINT_COOKIE_NAME,
  ONE_DAY_MS,
  setAuthCookie,
  clearAuthCookie,
  getAuthTokenFromRequest
};
