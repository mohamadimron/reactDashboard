const MAX_MESSAGE_LENGTH = 8000;
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal
  ? (import.meta.env.VITE_API_URL_DEV || `http://${window.location.hostname}:5000/api`)
  : import.meta.env.VITE_API_URL;

const truncate = (value) => {
  const text = String(value ?? '');
  if (text.length <= MAX_MESSAGE_LENGTH) return text;
  return `${text.slice(0, MAX_MESSAGE_LENGTH)}...[truncated]`;
};

const getErrorMessage = (error) => {
  if (!error) return 'Unknown frontend error';
  if (typeof error === 'string') return error;
  return error.message || error.reason?.message || String(error);
};

const getErrorStack = (error) => {
  if (!error || typeof error === 'string') return null;
  return error.stack || error.reason?.stack || null;
};

export const writeFrontendLog = async ({
  type = 'EVENT',
  level = 'INFO',
  category = 'frontend',
  action = 'frontend_event',
  message = '',
  metadata = null,
  stack = null
}) => {
  try {
    await fetch(`${API_BASE_URL}/system-logs/client`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      type,
      level,
      category,
      action,
      message: truncate(message || action),
      path: window.location.pathname + window.location.search,
      metadata,
      stack: stack ? truncate(stack) : null
      })
    });
  } catch {
    // Logging must never break the user flow.
  }
};

export const logFrontendEvent = (action, metadata = null, message = action) => {
  void writeFrontendLog({
    type: 'EVENT',
    level: 'INFO',
    category: 'frontend-event',
    action,
    message,
    metadata
  });
};

export const logFrontendError = (action, error, metadata = null) => {
  void writeFrontendLog({
    type: 'ERROR',
    level: 'ERROR',
    category: 'frontend-error',
    action,
    message: getErrorMessage(error),
    metadata,
    stack: getErrorStack(error)
  });
};

export const installFrontendErrorLogging = () => {
  const handleError = (event) => {
    logFrontendError('window_error', event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };

  const handleUnhandledRejection = (event) => {
    logFrontendError('unhandled_rejection', event.reason, {
      reasonType: typeof event.reason
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
};
