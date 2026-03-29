const { getRequiredEnv } = require('./env');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({
  connectionString: getRequiredEnv('DATABASE_URL'),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

prisma.pool = pool;

module.exports = prisma;
