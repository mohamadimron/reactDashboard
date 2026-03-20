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

// 1. Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be loaded from external domains
}));

// 2. CORS Configuration
const allowedOrigins = [
  // 'http://localhost:5173',
  // 'http://127.0.0.1:5173',
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
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// 3. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict limit for login/register
  message: 'Too many authentication attempts, please try again after 15 minutes'
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// 4. Body Parser with Size Limit (Prevent Payload Injection)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Static Files
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (origin, res) => {
  res.status(200).json({ status: 'API is healthy and secured' });
});

// 7. Global Error Handler (Prevent Data Leakage via Stack Traces)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Security] Server secured and running on port ${PORT}`);
});
