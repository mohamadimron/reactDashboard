let hasAuthenticatedSession = false;

export const setAuthenticatedSession = (value) => {
  hasAuthenticatedSession = Boolean(value);
};

export const hasActiveAuthenticatedSession = () => hasAuthenticatedSession;
