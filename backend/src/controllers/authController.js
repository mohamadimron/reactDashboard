const prisma = require('../utils/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
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
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      console.warn(`[Auth] Login blocked: Account inactive (${email})`);
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Login failed: Incorrect password for (${email})`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const sessionId = require('crypto').randomUUID();
    const token = generateToken(user.id, user.role, sessionId);

    // Update last login and session ID
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        lastSessionId: sessionId
      }
    });

    console.log(`[Auth] Login successful: ${email}`);

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

module.exports = { register, login };
