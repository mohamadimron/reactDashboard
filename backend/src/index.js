const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');
const messageRoutes = require('./routes/messageRoutes');
const roleRoutes = require('./routes/roleRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// 0. Trust Proxy (Crucial for HTTPS/Nginx to pass correct origin/IP)
app.set('trust proxy', 1);

// 1. ABSOLUTE MANUAL CORS (Must be at the very top, before ANY other middleware)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.0.105:5173',
    'https://test2.tuman.web.id',
    'https://apitest2.tuman.web.id'
  ];
  
  const origin = req.headers.origin;
  
  // If the origin is in our whitelist, we explicitly allow it
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // These headers must be present on ALL responses, including preflight
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Allow-Headers');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h

  // INSTANT RESPONSE FOR PREFLIGHT (OPTIONS)
  // This bypasses rate limiters and body parsers for technical browser requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 2. Security Hardening (Adjusted to not interfere with CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 3. Body Parser (Placed after CORS check)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting (High limits to prevent false positives during testing)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, 
  standardHeaders: true,
  legacyHeaders: false,
  // Ensure rate limiter also returns CORS headers if it blocks a request
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests, please try again later' });
  }
});
app.use('/api/', apiLimiter);

// 5. Static Files (Served under /api/uploads)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'API Online', secure: true });
});

// 7. Global Error Handler (Guaranteed to not leak info but maintain CORS)
app.use((err, req, res, next) => {
  console.error('[CRITICAL ERROR]', err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CORE] Server accurately bound to port ${PORT}`);
  console.log(`[AUTH] Single-session system active`);
});
