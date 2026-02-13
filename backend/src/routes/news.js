const { Router } = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { fetchAllNews } = require('../services/news-fetcher');

const router = Router();

// GET /api/news — return cached news (public)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const source = req.query.source;

    let query = 'SELECT * FROM news_cache';
    const params = [];

    if (source) {
      params.push(source);
      query += ` WHERE api_source = $${params.length}`;
    }

    query += ' ORDER BY published_at DESC';
    params.push(limit);
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

// POST /api/news/refresh — trigger news fetch (admin)
router.post('/refresh', auth, adminOnly, async (req, res) => {
  try {
    const result = await fetchAllNews();
    res.json({ success: true, data: { message: 'News refreshed', count: result.count } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to refresh news' });
  }
});

module.exports = router;
