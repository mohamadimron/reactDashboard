const prisma = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { logAuthEvent } = require('../utils/authLogger');
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
    const email = rawEmail.toLowerCase(); // Normalize email

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine role: if first user, make them ADMIN
    const count = await prisma.user.count();
    const role = count === 0 ? 'ADMIN' : 'USER';

    const hashedPassword = await hashPassword(password);
    const sessionId = require('crypto').randomUUID();
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, lastSessionId: sessionId },
    });

    const token = generateToken(user.id, user.role, sessionId);

    console.log(`[Auth] New user registered: ${email} (${role})`);

    // Log the event
    logAuthEvent({
      userId: user.id,
      usernameInput: email,
      eventType: 'LOGIN_SUCCESS',
      req
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
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
    const email = rawEmail.toLowerCase(); // Normalize email

    console.log(`[Auth] Login attempt for: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`[Auth] Login failed: User not found (${email})`);
      logAuthEvent({ usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: 'USER_NOT_FOUND', req });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      console.warn(`[Auth] Login blocked: Account inactive (${email})`);
      logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: 'ACCOUNT_INACTIVE', req });
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login failed: Incorrect password for (${email})`);
      logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_FAILED', failureReason: 'WRONG_PASSWORD', req });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const sessionId = require('crypto').randomUUID();
    const token = generateToken(user.id, user.role, sessionId);

    // Update last login, session ID, and device info
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();
    const browser = result.browser.name || 'Unknown Browser';
    const os = result.os.name || 'Unknown OS';
    const deviceType = result.device.type ? result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1) : 'Desktop';
    const deviceInfo = `${browser} on ${os} (${deviceType})`;

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        lastSessionId: sessionId,
        deviceInfo: deviceInfo
      }
    });

    console.log(`[Auth] Login successful: ${email}`);
    
    // Log the success event
    logAuthEvent({ userId: user.id, usernameInput: email, eventType: 'LOGIN_SUCCESS', req });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('[Auth] Login Error:', error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

const logout = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user) {
      logAuthEvent({ userId: user.id, usernameInput: user.email, eventType: 'LOGOUT', req });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during logout' });
  }
};

module.exports = { register, login, logout };
