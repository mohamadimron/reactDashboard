const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');
const { getRequiredEnv } = require('../utils/env');
const { clearAuthCookie, getAuthTokenFromRequest } = require('../utils/authCookie');

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
const JWT_SECRET = getRequiredEnv('JWT_SECRET');

const protect = async (req, res, next) => {
  const token = getAuthTokenFromRequest(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Enforce single session: Check if sessionId matches latest in DB
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId },
        include: { role: true }
      });

      if (!user || user.lastSessionId !== decoded.sessionId) {
        clearAuthCookie(res);
        return res.status(401).json({ 
          title: 'Multiple Login Detected',
          message: 'Session invalidated. You have logged in from another device.',
          code: 'SESSION_REPLACED'
        });
      }

      const now = Date.now();
      const lastActivityTime = user.lastActivity ? new Date(user.lastActivity).getTime() : null;
      const isIdleExpired = lastActivityTime && now - lastActivityTime > INACTIVITY_LIMIT_MS;

      if (isIdleExpired) {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: {
            lastActivity: null,
            lastSessionId: null
          }
        });

        clearAuthCookie(res);
        return res.status(401).json({
          title: 'Session Expired',
          message: 'Your session has ended due to more than 1 hour of inactivity. Please log in again to continue.',
          code: 'SESSION_IDLE_TIMEOUT'
        });
      }

      // Asynchronously update last activity (non-blocking)
      prisma.user.update({
        where: { id: decoded.userId },
        data: { lastActivity: new Date() }
      }).catch(err => console.error('[Activity] Update failed:', err.message));

      // Attach full user info with permissions to req.user
      req.user = {
        userId: user.id,
        role: user.role.name,
        permissions: {
          canViewUsers: user.role.canViewUsers,
          canCreateUsers: user.role.canCreateUsers,
          canEditUsers: user.role.canEditUsers,
          canDeleteUsers: user.role.canDeleteUsers,
          canViewLogs: user.role.canViewLogs,
          canManageSettings: user.role.canManageSettings,
          canViewMessages: user.role.canViewMessages,
          canDeleteMessages: user.role.canDeleteMessages
        }
      };
      return next();
    } catch (error) {
      console.error('[Auth] Middleware Error:', error);
      clearAuthCookie(res);
      return res.status(401).json({
        title: 'Session Ended',
        message: 'Your session is no longer valid. Please log in again to continue.',
        code: 'SESSION_INVALID'
      });
    }
  }

  clearAuthCookie(res);
  return res.status(401).json({ message: 'Not authorized, no token' });
};

// Legacy ADMIN check (for critical system operations)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// New Granular Permission Middleware
const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    if (req.user && req.user.permissions && req.user.permissions[permissionKey]) {
      next();
    } else {
      console.warn(`[RBAC] Access denied for ${req.user?.role} - Missing: ${permissionKey}`);
      res.status(403).json({ 
        message: `Forbidden: You do not have permission to ${permissionKey.replace(/([A-Z])/g, ' $1').toLowerCase()}` 
      });
    }
  };
};

module.exports = { protect, admin, checkPermission };
