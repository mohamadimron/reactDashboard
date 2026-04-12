const prisma = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { logAuthEvent } = require('../utils/authLogger');
const {
  DEFAULT_PUBLIC_REGISTRATION_ROLE,
  SYSTEM_SETTING_KEYS,
  getSystemSetting,
  getRegisterMaxPerDay,
  getRegistrationLimitWindow,
  isRegisterPageEnabled
} = require('../utils/systemSettings');
const { sanitizeUser } = require('../utils/userSerializer');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const z = require('zod');

const REGISTER_DAILY_LIMIT_LOCK_ID = 2026041201;

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const register = async (req, res) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.format() });
    }

    const { name, email: rawEmail, password } = parsedData.data;
    const email = rawEmail.toLowerCase();
    const hashedPassword = await hashPassword(password);
    const sessionId = require('crypto').randomUUID();

    // Device Detection for Registration
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const deviceInfo = `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''} on ${ua.os.name || 'Unknown'} ${ua.os.version || ''} (${ua.device.type ? ua.device.type.charAt(0).toUpperCase() + ua.device.type.slice(1) : 'Desktop'})`;

    const user = await prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`
        SELECT 1 AS "locked"
        FROM (SELECT pg_advisory_xact_lock(${REGISTER_DAILY_LIMIT_LOCK_ID})) AS register_limit_lock
      `);

      const registerEnabled = await isRegisterPageEnabled();
      if (!registerEnabled) {
        const error = new Error('Public registration is currently disabled');
        error.statusCode = 403;
        throw error;
      }

      const userExists = await tx.user.findUnique({ where: { email } });
      if (userExists) {
        const error = new Error('User already exists');
        error.statusCode = 400;
        throw error;
      }

      const registerMaxPerDay = await getRegisterMaxPerDay();
      const registrationWindow = getRegistrationLimitWindow();
      const registeredToday = await tx.user.count({
        where: {
          createdAt: {
            gte: registrationWindow.start,
            lt: registrationWindow.end
          }
        }
      });

      if (registeredToday >= registerMaxPerDay) {
        const error = new Error(`Daily registration limit reached. Maximum ${registerMaxPerDay} users can register per day.`);
        error.statusCode = 429;
        throw error;
      }

      const configuredRoleName = await getSystemSetting(SYSTEM_SETTING_KEYS.DEFAULT_REGISTRATION_ROLE);
      const normalizedConfiguredRole = configuredRoleName?.trim().toUpperCase();
      const roleName =
        normalizedConfiguredRole && normalizedConfiguredRole !== 'ADMIN'
          ? normalizedConfiguredRole
          : DEFAULT_PUBLIC_REGISTRATION_ROLE;

      let role = await tx.role.findUnique({ where: { name: roleName } });
      if (!role) {
        role = await tx.role.findUnique({ where: { name: DEFAULT_PUBLIC_REGISTRATION_ROLE } });
      }

      if (!role) {
        role = await tx.role.findFirst({
          where: { name: { not: 'ADMIN' } },
          orderBy: { name: 'asc' }
        });
      }

      const status = await tx.status.findUnique({ where: { name: 'ACTIVE' } });

      if (!role) {
        const error = new Error('No valid default role is configured for registration');
        error.statusCode = 500;
        throw error;
      }

      if (!status) {
        const error = new Error('ACTIVE status is not configured in the system');
        error.statusCode = 500;
        throw error;
      }

      return tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: role.id,
          statusId: status.id,
          lastSessionId: sessionId,
          lastLogin: new Date(),
          lastActivity: new Date(),
          deviceInfo: deviceInfo
        },
        include: { role: true, status: true }
      });
    });

    const token = generateToken(user.id, user.role.name, user.lastSessionId);
    setAuthCookie(res, token);

    logAuthEvent({
      userId: user.id,
      usernameInput: email,
      eventType: 'LOGIN_SUCCESS',
      req
    });

    res.status(201).json({
      ...sanitizeUser(user),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error('[Auth] Register Error:', error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.format() });
    }

    const { email: rawEmail, password } = parsedData.data;
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { role: true, status: true }
    });

    if (!user) {
      logAuthEvent({ usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: 'USER_NOT_FOUND', req });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Dynamic Status Check
    if (user.status.name !== 'ACTIVE') {
      const reason = user.status.name === 'SUSPEND' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_INACTIVE';
      logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: reason, req });
      return res.status(403).json({ message: `Your account status is ${user.status.name}. Please contact administrator.` });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: 'WRONG_PASSWORD', req });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const sessionId = require('crypto').randomUUID();
    const token = generateToken(user.id, user.role.name, sessionId);

    // Device Detection for Login
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const deviceInfo = `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''} on ${ua.os.name || 'Unknown'} ${ua.os.version || ''} (${ua.device.type ? ua.device.type.charAt(0).toUpperCase() + ua.device.type.slice(1) : 'Desktop'})`;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastActivity: new Date(),
        lastSessionId: sessionId,
        deviceInfo: deviceInfo
      },
      include: { role: true, status: true }
    });

    setAuthCookie(res, token);
    logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_SUCCESS', req });

    res.json({
      ...sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error('[Auth] Login Error:', error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

const logout = async (req, res) => {
  try {
    clearAuthCookie(res);
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user) {
      logAuthEvent({ userId: user.id, usernameInput: user.email, eventType: 'LOGOUT', req });
      
      // Force offline status on logout
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivity: null,
          lastSessionId: null
        }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout Error:', error);
    clearAuthCookie(res);
    res.status(500).json({ message: 'Server Error during logout' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true, status: true }
    });

    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({
        message: 'Session invalid. Please log in again.',
        code: 'SESSION_INVALID'
      });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('[Auth] Current User Error:', error);
    res.status(500).json({ message: 'Server Error while fetching session user' });
  }
};

module.exports = { register, login, logout, getCurrentUser };
