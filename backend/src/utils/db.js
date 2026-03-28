const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Use individual parameters to ensure correct type handling
const pool = new Pool({
  user: 'user-react-dashboard',
  host: '192.168.0.105',
  database: 'react-dashboard',
  password: 'NoComent@x9x9',
  port: 5432,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

prisma.pool = pool;

module.exports = prisma;
