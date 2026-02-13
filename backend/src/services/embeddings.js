const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Generate an embedding for a document chunk (for indexing).
 * Uses RETRIEVAL_DOCUMENT task type for optimal indexing performance.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} Array of 768-dimensional embedding values
 */
async function embedDocument(text) {
  const provider = env.embeddingProvider;

  if (provider === 'google') {
    return generateGoogleEmbedding(text, 'RETRIEVAL_DOCUMENT');
  } else {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Generate an embedding for a query (for searching).
 * Uses RETRIEVAL_QUERY task type for optimal search performance.
 * @param {string} text - The query text to embed
 * @returns {Promise<number[]>} Array of 768-dimensional embedding values
 */
async function embedQuery(text) {
  const provider = env.embeddingProvider;

  if (provider === 'google') {
    return generateGoogleEmbedding(text, 'RETRIEVAL_QUERY');
  } else {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Generate an embedding using Google's text-embedding-004 model.
 * @param {string} text - The text to embed
 * @param {string} taskType - Either 'RETRIEVAL_DOCUMENT' or 'RETRIEVAL_QUERY'
 * @returns {Promise<number[]>} Array of 768-dimensional embedding values
 */
async function generateGoogleEmbedding(text, taskType) {
  if (!env.geminiApiKey) {
    throw new Error('Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.');
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.geminiApiKey);

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType,
    });

    return result.embedding.values;
  } catch (err) {
    logger.error({ err, taskType }, 'Google embedding API error');
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
}

module.exports = { embedDocument, embedQuery };
