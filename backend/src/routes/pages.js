const { Router } = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = Router();

// GET /api/pages — list all pages (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT id, slug, title, category, sort_order, created_at, updated_at FROM pages';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    query += ' ORDER BY sort_order, title';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list pages' });
  }
});

// GET /api/pages/:slug — get page by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pages WHERE slug = $1', [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get page' });
  }
});

// POST /api/pages — create page (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { slug, title, category, content, sort_order } = req.body;
    if (!slug || !title) {
      return res.status(400).json({ success: false, error: 'Slug and title are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO pages (slug, title, category, content, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [slug, title, category || null, content || '', sort_order || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Page with this slug already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create page' });
  }
});

// PUT /api/pages/:slug — update page (admin)
router.put('/:slug', auth, adminOnly, async (req, res) => {
  try {
    const { title, category, content, sort_order } = req.body;
    const { rows } = await pool.query(
      `UPDATE pages SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        content = COALESCE($3, content),
        sort_order = COALESCE($4, sort_order)
       WHERE slug = $5
       RETURNING *`,
      [title, category, content, sort_order, req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update page' });
  }
});

module.exports = router;
