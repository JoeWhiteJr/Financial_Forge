-- 001_initial_schema.sql
-- Core tables: users, pages, bloomberg_commands, books, news_cache

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bloomberg_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    when_to_use TEXT,
    related_commands TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100),
    summary TEXT,
    difficulty VARCHAR(50),
    why_it_matters TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100),
    title VARCHAR(500),
    url TEXT,
    summary TEXT,
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_category ON pages(category);
CREATE INDEX idx_bloomberg_category ON bloomberg_commands(category);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_news_fetched_at ON news_cache(fetched_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bloomberg_commands_updated_at
    BEFORE UPDATE ON bloomberg_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
