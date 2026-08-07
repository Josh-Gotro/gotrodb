const { Pool } = require('pg');

// Pool instead of a single Client: survives dropped connections (Heroku
// recycles idle ones) and doesn't serialize every query through one socket.
// pool.query() has the same signature the rest of the code already uses.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Heroku
      },
    }
  : {
      user: process.env.PSQLUSER,
      host: 'localhost',
      database: 'gotro_db',
      password: process.env.PSQLPASS,
      port: 5432,
    };

const pool = new Pool({ ...poolConfig, max: 5 });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.message);
});

module.exports = pool;
