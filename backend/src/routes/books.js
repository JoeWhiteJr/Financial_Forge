const { Router } = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = Router();

// GET /api/books — list all books, optional category filter (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM books';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY sort_order, title';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list books' });
  }
});

// POST /api/books — create book (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, author, category, summary, difficulty, why_it_matters, sort_order } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO books (title, author, category, summary, difficulty, why_it_matters, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, author || null, category || null, summary || null, difficulty || null, why_it_matters || null, sort_order || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create book' });
  }
});

// PUT /api/books/:id — update book (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, author, category, summary, difficulty, why_it_matters, sort_order } = req.body;
    const { rows } = await pool.query(
      `UPDATE books SET
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        category = COALESCE($3, category),
        summary = COALESCE($4, summary),
        difficulty = COALESCE($5, difficulty),
        why_it_matters = COALESCE($6, why_it_matters),
        sort_order = COALESCE($7, sort_order)
       WHERE id = $8
       RETURNING *`,
      [title, author, category, summary, difficulty, why_it_matters, sort_order, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id — delete book (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    res.json({ success: true, data: { message: 'Book deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete book' });
  }
});

module.exports = router;
