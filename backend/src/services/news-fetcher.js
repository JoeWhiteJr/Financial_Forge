const { pool } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

async function fetchNews() {
  if (!env.finnhubApiKey) {
    logger.warn('FINNHUB_API_KEY not set — skipping news fetch');
    return { count: 0 };
  }

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${env.finnhubApiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API returned status ${response.status}`);
    }

    const articles = await response.json();

    if (!Array.isArray(articles) || articles.length === 0) {
      logger.info('No articles returned from Finnhub');
      return { count: 0 };
    }

    // Map results to our schema
    const mapped = articles.map(article => ({
      source: article.source || 'Unknown',
      title: article.headline || article.title || 'Untitled',
      url: article.url || '',
      summary: article.summary || '',
      published_at: article.datetime
        ? new Date(article.datetime * 1000)
        : new Date(),
    }));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear old news_cache entries (older than 24 hours)
      await client.query(
        "DELETE FROM news_cache WHERE fetched_at < NOW() - INTERVAL '24 hours'"
      );

      // Insert new entries
      for (const item of mapped) {
        await client.query(
          `INSERT INTO news_cache (source, title, url, summary, published_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.source, item.title, item.url, item.summary, item.published_at]
        );
      }

      await client.query('COMMIT');
      logger.info({ count: mapped.length }, 'News cache refreshed');
      return { count: mapped.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error({ err }, 'Failed to fetch news from Finnhub');
    throw err;
  }
}

module.exports = { fetchNews };
