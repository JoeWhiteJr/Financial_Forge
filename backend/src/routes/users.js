const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = Router();

// GET /api/users — list all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

// POST /api/users — create user (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { email, name, password, is_admin } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, error: 'Email, name, and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, is_admin)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, is_admin, created_at`,
      [email, name, passwordHash, is_admin || false]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// PUT /api/users/:id — update user (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, is_admin, password } = req.body;

    // If password is provided, hash it and update all fields
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          is_admin = COALESCE($2, is_admin),
          password_hash = $3
         WHERE id = $4
         RETURNING id, email, name, is_admin, created_at`,
        [name, is_admin, passwordHash, req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, data: rows[0] });
    }

    // No password change
    const { rows } = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        is_admin = COALESCE($2, is_admin)
       WHERE id = $3
       RETURNING id, email, name, is_admin, created_at`,
      [name, is_admin, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id — delete user (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

module.exports = router;
