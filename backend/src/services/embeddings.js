const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Generate an embedding for a document chunk (for indexing).
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} Array of embedding values
 */
async function embedDocument(text) {
  const provider = env.embeddingProvider;

  if (provider === 'voyage') {
    return generateVoyageEmbedding(text, 'document');
  } else if (provider === 'google') {
    return generateGoogleEmbedding(text, 'RETRIEVAL_DOCUMENT');
  } else {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Generate an embedding for a query (for searching).
 * @param {string} text - The query text to embed
 * @returns {Promise<number[]>} Array of embedding values
 */
async function embedQuery(text) {
  const provider = env.embeddingProvider;

  if (provider === 'voyage') {
    return generateVoyageEmbedding(text, 'query');
  } else if (provider === 'google') {
    return generateGoogleEmbedding(text, 'RETRIEVAL_QUERY');
  } else {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Generate an embedding using Voyage AI's voyage-finance-2 model.
 * Optimized for finance retrieval and RAG. Returns 1024-dimensional vectors.
 * @param {string} text - The text to embed
 * @param {string} inputType - Either 'document' or 'query'
 * @returns {Promise<number[]>} Array of 1024-dimensional embedding values
 */
async function generateVoyageEmbedding(text, inputType) {
  if (!env.voyageApiKey) {
    throw new Error('Voyage API key is not configured. Please set the VOYAGE_API_KEY environment variable.');
  }

  try {
    const { VoyageAIClient } = require('voyageai');
    const client = new VoyageAIClient({ apiKey: env.voyageApiKey });

    const result = await client.embed({
      input: [text],
      model: 'voyage-finance-2',
      inputType,
    });

    return result.data[0].embedding;
  } catch (err) {
    logger.error({ err, inputType }, 'Voyage embedding API error');
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
}

/**
 * Generate an embedding using Google's gemini-embedding-001 model (fallback).
 * @param {string} text - The text to embed
 * @param {string} taskType - Either 'RETRIEVAL_DOCUMENT' or 'RETRIEVAL_QUERY'
 * @returns {Promise<number[]>} Array of 768-dimensional embedding values
 */
async function generateGoogleEmbedding(text, taskType) {
  if (!env.geminiApiKey) {
    throw new Error('Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.');
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        taskType,
        outputDimensionality: 768,
      },
    });

    return result.embeddings[0].values;
  } catch (err) {
    logger.error({ err, taskType }, 'Google embedding API error');
    throw new Error(`Failed to generate embedding: ${err.message}`);
  }
}

module.exports = { embedDocument, embedQuery };
