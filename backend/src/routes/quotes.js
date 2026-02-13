const { Router } = require('express');
const { fetchQuotes } = require('../services/quote-fetcher');

const router = Router();

// GET /api/quotes — public endpoint for stock quotes
router.get('/', async (_req, res) => {
  try {
    const result = await fetchQuotes();
    res.json({
      success: true,
      data: result.data,
      fetchedAt: result.fetchedAt,
      stale: result.stale,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch quotes' });
  }
});

module.exports = router;
