require('dotenv').config();
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const defaultUrl = new URL(process.env.DATABASE_URL);
const postgresUrl = new URL(process.env.DATABASE_URL);
postgresUrl.pathname = '/postgres';

async function check() {
  const client = new Client({ connectionString: postgresUrl.toString() });
  try {
    await client.connect();
    console.log('Connected to postgres database');
    
    const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Available databases:', dbs.rows.map(r => r.datname));
    
    for (const dbName of dbs.rows.map(r => r.datname)) {
      const dbUrl = new URL(defaultUrl.toString());
      dbUrl.pathname = `/${dbName}`;
      const dbClient = new Client({ connectionString: dbUrl.toString() });
      try {
        await dbClient.connect();
        console.log(`Connected to ${dbName}`);
        const schemas = await dbClient.query("SELECT schema_name FROM information_schema.schemata");
        console.log(`Schemas in ${dbName}:`, schemas.rows.map(r => r.schema_name));
        await dbClient.end();
      } catch (e) {
        console.log(`Could not connect to ${dbName}: ${e.message}`);
      }
    }
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

check();
