const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Enforce single session: Check if sessionId matches latest in DB
      const prisma = require('../utils/db');
      const user = await prisma.user.findUnique({ 
        where: { id: decoded.userId },
        select: { lastSessionId: true }
      });

      if (!user || user.lastSessionId !== decoded.sessionId) {
        return res.status(401).json({ 
          message: 'Session invalidated. You have logged in from another device.',
          code: 'SESSION_REPLACED'
        });
      }

      req.user = decoded; // { userId, role, sessionId }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
