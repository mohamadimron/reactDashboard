const jwt = require('jsonwebtoken');
const prisma = require('../utils/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Enforce single session: Check if sessionId matches latest in DB
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId },
        include: { role: true }
      });

      if (!user || user.lastSessionId !== decoded.sessionId) {
        return res.status(401).json({ 
          message: 'Session invalidated. You have logged in from another device.',
          code: 'SESSION_REPLACED'
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
          canEditUsers: user.role.canEditUsers,
          canDeleteUsers: user.role.canDeleteUsers,
          canViewLogs: user.role.canViewLogs,
          canManageSettings: user.role.canManageSettings
        }
      };
      next();
    } catch (error) {
      console.error('[Auth] Middleware Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
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
