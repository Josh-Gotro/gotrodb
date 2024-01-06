const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PSQLUSER,
  host: 'localhost',
  database: 'gotro_db',
  password: process.env.PSQLPASS,
  port: 5432,
});

module.exports = pool;
