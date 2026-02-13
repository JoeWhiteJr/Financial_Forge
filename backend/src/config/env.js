const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/financial_forge',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-long',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  finnhubApiKey: process.env.FINNHUB_API_KEY || '',
  newsapiKey: process.env.NEWSAPI_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  voyageApiKey: process.env.VOYAGE_API_KEY || '',
  llmProvider: process.env.LLM_PROVIDER || 'gemini',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'google',
  ragChunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '500', 10),
  ragChunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50', 10),
  ragTopK: parseInt(process.env.RAG_TOP_K || '5', 10),
};

// Production environment validation — fail fast on bad config
if (config.nodeEnv === 'production') {
  const errors = [];
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }
  if (config.databaseUrl.includes('localhost')) {
    errors.push('DATABASE_URL must not contain "localhost" in production');
  }
  if (config.frontendUrl.includes('localhost')) {
    errors.push('FRONTEND_URL must not contain "localhost" in production');
  }
  if (errors.length > 0) {
    throw new Error(`Production config errors:\n  - ${errors.join('\n  - ')}`);
  }
}

module.exports = config;
