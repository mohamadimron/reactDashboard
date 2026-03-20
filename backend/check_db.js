const { Client } = require('pg');

const config = {
  user: 'user-react-dashboard',
  host: '192.168.0.105',
  database: 'postgres',
  password: 'NoComent@x9x9',
  port: 5432,
};

async function check() {
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected to postgres database');
    
    const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Available databases:', dbs.rows.map(r => r.datname));
    
    for (const dbName of dbs.rows.map(r => r.datname)) {
      const dbClient = new Client({ ...config, database: dbName });
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
