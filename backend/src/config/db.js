const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected pool error');
});

// Retry connection with exponential backoff
async function waitForDb(maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info('Database connected');
      return;
    } catch (err) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      logger.warn({ attempt, maxRetries, delay }, `DB not ready, retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to database after retries');
}

module.exports = { pool, waitForDb };
