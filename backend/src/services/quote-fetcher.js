const env = require('../config/env');
const logger = require('../config/logger');

const SYMBOLS = [
  'SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'GOOGL',
  'AMZN', 'NVDA', 'META', 'JPM', 'GS', 'TSLA', 'BRK.B',
];

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

let cache = { data: [], fetchedAt: null };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchQuotes() {
  if (!env.finnhubApiKey) {
    return { data: [], fetchedAt: null, stale: false };
  }

  // Return fresh cache if available
  if (cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return { data: cache.data, fetchedAt: cache.fetchedAt, stale: false };
  }

  const quotes = [];
  let anySuccess = false;

  for (const symbol of SYMBOLS) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${env.finnhubApiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn({ symbol, status: response.status }, 'Quote fetch failed for symbol');
        continue;
      }

      const data = await response.json();

      if (data && typeof data.c === 'number' && data.c > 0) {
        quotes.push({
          symbol,
          price: data.c,
          change: data.d,
          changePercent: data.dp,
        });
        anySuccess = true;
      }
    } catch (err) {
      logger.warn({ symbol, err: err.message }, 'Quote fetch error for symbol');
    }

    // 50ms delay between calls to stay under rate limit
    await sleep(50);
  }

  if (anySuccess) {
    cache = { data: quotes, fetchedAt: Date.now() };
    return { data: quotes, fetchedAt: cache.fetchedAt, stale: false };
  }

  // Finnhub down entirely — return stale cache
  if (cache.data.length > 0) {
    return { data: cache.data, fetchedAt: cache.fetchedAt, stale: true };
  }

  return { data: [], fetchedAt: null, stale: false };
}

module.exports = { fetchQuotes };
