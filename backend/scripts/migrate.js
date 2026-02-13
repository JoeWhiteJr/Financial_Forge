const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/financial_forge',
});

async function migrate() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get already applied migrations
    const { rows: applied } = await client.query('SELECT name FROM _migrations ORDER BY name');
    const appliedSet = new Set(applied.map(r => r.name));

    // Read migration files
    const migrationsDir = process.env.MIGRATIONS_DIR || path.join(__dirname, '../../database/migrations');
    // In Docker, /database is mounted from project root
    const resolvedDir = fs.existsSync(migrationsDir) ? migrationsDir : '/database/migrations';
    const files = fs.readdirSync(resolvedDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  [skip] ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(resolvedDir, file), 'utf8');

      console.log(`  [run]  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [FAIL] ${file}: ${err.message}`);
        throw err;
      }
    }

    if (ranCount === 0) {
      console.log('All migrations already applied.');
    } else {
      console.log(`${ranCount} migration(s) applied successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
