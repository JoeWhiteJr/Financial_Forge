const { Router } = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { fetchNews } = require('../services/news-fetcher');

const router = Router();

// GET /api/news — return cached news (public)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM news_cache ORDER BY published_at DESC LIMIT 50'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

// POST /api/news/refresh — trigger news fetch (admin)
router.post('/refresh', auth, adminOnly, async (req, res) => {
  try {
    const result = await fetchNews();
    res.json({ success: true, data: { message: 'News refreshed', count: result.count } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to refresh news' });
  }
});

module.exports = router;
