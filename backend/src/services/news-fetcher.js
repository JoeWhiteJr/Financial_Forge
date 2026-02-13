const crypto = require('crypto');
const { pool } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

function hashUrl(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

async function fetchFinnhubNews() {
  if (!env.finnhubApiKey) {
    logger.warn('FINNHUB_API_KEY not set — skipping Finnhub news fetch');
    return [];
  }

  const url = `https://finnhub.io/api/v1/news?category=general&token=${env.finnhubApiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Finnhub API returned status ${response.status}`);
  }

  const articles = await response.json();

  if (!Array.isArray(articles) || articles.length === 0) {
    return [];
  }

  return articles.map((article) => ({
    source: article.source || 'Unknown',
    title: article.headline || article.title || 'Untitled',
    url: article.url || '',
    summary: article.summary || '',
    published_at: article.datetime
      ? new Date(article.datetime * 1000)
      : new Date(),
    image_url: article.image || null,
    category: article.category || 'general',
    api_source: 'finnhub',
    url_hash: hashUrl(article.url || `finnhub-${article.id || Date.now()}`),
  }));
}

async function fetchNewsApiNews() {
  if (!env.newsapiKey) {
    logger.warn('NEWSAPI_KEY not set — skipping NewsAPI fetch');
    return [];
  }

  const url = `https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${env.newsapiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NewsAPI returned status ${response.status}`);
  }

  const data = await response.json();

  if (!data.articles || !Array.isArray(data.articles)) {
    return [];
  }

  return data.articles
    .filter((a) => a.url && a.title && a.title !== '[Removed]')
    .map((article) => ({
      source: article.source?.name || 'Unknown',
      title: article.title || 'Untitled',
      url: article.url,
      summary: article.description || '',
      published_at: article.publishedAt
        ? new Date(article.publishedAt)
        : new Date(),
      image_url: article.urlToImage || null,
      category: 'business',
      api_source: 'newsapi',
      url_hash: hashUrl(article.url),
    }));
}

async function fetchAllNews() {
  const results = await Promise.allSettled([
    fetchFinnhubNews(),
    fetchNewsApiNews(),
  ]);

  const allArticles = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      logger.error({ err: result.reason }, 'News source fetch failed');
    }
  }

  if (allArticles.length === 0) {
    logger.info('No articles fetched from any source');
    return { count: 0 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clean entries older than 48 hours
    await client.query(
      "DELETE FROM news_cache WHERE fetched_at < NOW() - INTERVAL '48 hours'"
    );

    let inserted = 0;
    for (const item of allArticles) {
      const { rowCount } = await client.query(
        `INSERT INTO news_cache (source, title, url, summary, published_at, image_url, category, api_source, url_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (url_hash) DO NOTHING`,
        [
          item.source,
          item.title,
          item.url,
          item.summary,
          item.published_at,
          item.image_url,
          item.category,
          item.api_source,
          item.url_hash,
        ]
      );
      inserted += rowCount;
    }

    await client.query('COMMIT');
    logger.info({ total: allArticles.length, inserted }, 'News cache refreshed from all sources');
    return { count: inserted };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { fetchAllNews };
