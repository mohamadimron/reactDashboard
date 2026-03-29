const SESSION_EXPIRY_REASONS = {
  FRONTEND_INACTIVITY_TIMEOUT: 'FRONTEND_INACTIVITY_TIMEOUT',
  SESSION_IDLE_TIMEOUT: 'SESSION_IDLE_TIMEOUT',
  SESSION_REPLACED: 'SESSION_REPLACED',
  SESSION_INVALID: 'SESSION_INVALID'
};

const SESSION_EXPIRY_CONTENT = {
  [SESSION_EXPIRY_REASONS.FRONTEND_INACTIVITY_TIMEOUT]: {
    title: 'Session Expired',
    message: 'Your session ended after 30 minutes without browser activity. Please log in again to continue.'
  },
  [SESSION_EXPIRY_REASONS.SESSION_IDLE_TIMEOUT]: {
    title: 'Session Expired',
    message: 'Your session ended after more than 1 hour without server activity. Please log in again to continue.'
  },
  [SESSION_EXPIRY_REASONS.SESSION_REPLACED]: {
    title: 'Multiple Login Detected',
    message: 'This account was signed in from another device or browser. Please log in again to continue securely.'
  },
  [SESSION_EXPIRY_REASONS.SESSION_INVALID]: {
    title: 'Session Ended',
    message: 'Your session is no longer valid. Please log in again to continue.'
  }
};

let sessionExpiryNoticeShown = false;

export const resetSessionExpiryNotice = () => {
  sessionExpiryNoticeShown = false;
};

export const resolveSessionExpiryDetail = (detail = {}) => {
  const reason = detail.reason || SESSION_EXPIRY_REASONS.SESSION_INVALID;
  const defaults = SESSION_EXPIRY_CONTENT[reason] || SESSION_EXPIRY_CONTENT[SESSION_EXPIRY_REASONS.SESSION_INVALID];

  return {
    reason,
    title: detail.title || defaults.title,
    message: detail.message || defaults.message
  };
};

export const emitSessionExpired = (detail = {}) => {
  if (sessionExpiryNoticeShown) return;

  sessionExpiryNoticeShown = true;
  window.dispatchEvent(new CustomEvent('session-expired', {
    detail: resolveSessionExpiryDetail(detail)
  }));
};

export { SESSION_EXPIRY_REASONS };
