const { Client } = require('pg');

const clientConfig = process.env.DATABASE_URL
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

const client = new Client(clientConfig);

client.connect();

module.exports = client;
