const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// 1. CORS Configuration - MUST BE AT THE TOP
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.0.105:5173',
  'https://test2.tuman.web.id',
  'https://apitest2.tuman.web.id'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      // During development/debugging, you might want to be more permissive:
      // callback(null, true); 
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 2. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Rate Limiting - Increased limits for better UX during testing
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased to 100 for testing
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// 4. Body Parser
app.use(express.json({ limit: '1mb' })); // Increased limit slightly
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Static Files
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Fix health check route arguments
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API is healthy and secured' });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy blocked this request' });
  }
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Security] Server secured and running on port ${PORT}`);
  console.log(`[CORS] Allowed Origins: ${allowedOrigins.join(', ')}`);
});
