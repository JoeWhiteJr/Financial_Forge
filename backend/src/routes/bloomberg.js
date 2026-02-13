const { Router } = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = Router();

// GET /api/bloomberg — list all commands, optional filtering (public)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM bloomberg_commands';
    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(
        `(command ILIKE $${idx} OR name ILIKE $${idx} OR description ILIKE $${idx})`
      );
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY category, command';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list bloomberg commands' });
  }
});

// GET /api/bloomberg/:id — get single command (public)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM bloomberg_commands WHERE id = $1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get command' });
  }
});

// POST /api/bloomberg — create command (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { command, name, description, category, when_to_use, related_commands } = req.body;
    if (!command || !name) {
      return res.status(400).json({ success: false, error: 'Command and name are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO bloomberg_commands (command, name, description, category, when_to_use, related_commands)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [command, name, description || null, category || null, when_to_use || null, related_commands || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create command' });
  }
});

// PUT /api/bloomberg/:id — update command (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { command, name, description, category, when_to_use, related_commands } = req.body;
    const { rows } = await pool.query(
      `UPDATE bloomberg_commands SET
        command = COALESCE($1, command),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        when_to_use = COALESCE($5, when_to_use),
        related_commands = COALESCE($6, related_commands)
       WHERE id = $7
       RETURNING *`,
      [command, name, description, category, when_to_use, related_commands, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update command' });
  }
});

// DELETE /api/bloomberg/:id — delete command (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM bloomberg_commands WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command not found' });
    }
    res.json({ success: true, data: { message: 'Command deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete command' });
  }
});

module.exports = router;
