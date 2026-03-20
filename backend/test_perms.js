const { Client } = require('pg');

const config = {
  user: 'user-react-dashboard',
  host: '192.168.0.105',
  database: 'react-dashboard',
  password: 'NoComent@x9x9',
  port: 5432,
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
