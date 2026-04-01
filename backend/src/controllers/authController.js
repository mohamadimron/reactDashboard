const prisma = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { logAuthEvent } = require('../utils/authLogger');
const { resolveRegistrationRole, isRegisterPageEnabled } = require('../utils/systemSettings');
const { sanitizeUser } = require('../utils/userSerializer');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');
const z = require('zod');

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

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const registerEnabled = await isRegisterPageEnabled();

    if (!registerEnabled) {
      return res.status(403).json({ message: 'Public registration is currently disabled' });
    }

    // Dynamic Role & Status lookup
    const [role, status] = await Promise.all([
      resolveRegistrationRole(),
      prisma.status.findUnique({ where: { name: 'ACTIVE' } })
    ]);

    if (!role) {
      return res.status(500).json({ message: 'No valid default role is configured for registration' });
    }

    if (!status) {
      return res.status(500).json({ message: 'ACTIVE status is not configured in the system' });
    }

    const hashedPassword = await hashPassword(password);
    const sessionId = require('crypto').randomUUID();
    
    // Device Detection for Registration
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const deviceInfo = `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''} on ${ua.os.name || 'Unknown'} ${ua.os.version || ''} (${ua.device.type ? ua.device.type.charAt(0).toUpperCase() + ua.device.type.slice(1) : 'Desktop'})`;

    const user = await prisma.user.create({
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

    const token = generateToken(user.id, user.role.name, sessionId);
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
