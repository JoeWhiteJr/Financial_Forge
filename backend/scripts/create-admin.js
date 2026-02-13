const readline = require('readline');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/financial_forge',
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function createAdmin() {
  try {
    const email = await ask('Admin email: ');
    const name = await ask('Admin name: ');
    const password = await ask('Admin password: ');

    if (!email || !name || !password) {
      console.error('All fields are required.');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('Password must be at least 8 characters.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, is_admin)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, name, is_admin`,
      [email, name, passwordHash]
    );

    console.log(`\nAdmin account created:`);
    console.log(`  ID:    ${rows[0].id}`);
    console.log(`  Email: ${rows[0].email}`);
    console.log(`  Name:  ${rows[0].name}`);
    console.log(`  Admin: ${rows[0].is_admin}`);
  } catch (err) {
    if (err.code === '23505') {
      console.error('An account with this email already exists.');
    } else {
      console.error('Error creating admin:', err.message);
    }
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();
