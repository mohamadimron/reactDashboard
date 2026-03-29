require('dotenv').config();
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const config = {
  connectionString: process.env.DATABASE_URL,
};

async function test() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to react-dashboard');
    
    console.log('Testing table creation in public schema...');
    await client.query('CREATE TABLE IF NOT EXISTS _prisma_test (id serial PRIMARY KEY)');
    console.log('Table creation success!');
    await client.query('DROP TABLE _prisma_test');
    console.log('Table drop success!');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
