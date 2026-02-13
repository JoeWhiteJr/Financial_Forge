ALTER TABLE news_cache ADD COLUMN IF NOT EXISTS api_source VARCHAR(50) DEFAULT 'finnhub';
ALTER TABLE news_cache ADD COLUMN IF NOT EXISTS url_hash VARCHAR(64);
ALTER TABLE news_cache ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE news_cache ADD COLUMN IF NOT EXISTS image_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url_hash ON news_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_cache(category);
