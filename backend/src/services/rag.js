const { pool } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');
const { embedQuery } = require('./embeddings');
const { generateResponse } = require('./llm');

/**
 * Query the RAG pipeline: embed the question, search for relevant chunks,
 * and generate an answer using the LLM.
 * @param {string} question - The user's question
 * @param {string} corpus - The corpus to search in
 * @returns {Promise<{answer: string, sources: Array}>}
 */
async function queryRag(question, corpus) {
  logger.info({ question, corpus }, 'RAG query started');

  // Step 1: Generate query embedding
  let queryEmbedding;
  try {
    queryEmbedding = await embedQuery(question);
  } catch (err) {
    logger.error({ err }, 'Failed to generate query embedding');
    throw new Error(`Failed to generate query embedding: ${err.message}`);
  }

  // Format embedding as pgvector string
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Step 2: Search document_chunks by cosine similarity
  // Note: pgvector parameterized queries require cast through text first
  const { rows: chunks } = await pool.query(
    `SELECT id, corpus, source_file, chunk_index, content, metadata,
            1 - (embedding <=> $1::text::vector) as similarity
     FROM document_chunks
     WHERE corpus = $2
     ORDER BY embedding <=> $1::text::vector
     LIMIT $3`,
    [embeddingStr, corpus, env.ragTopK]
  );

  logger.info({ corpus, matchCount: chunks.length, topSimilarity: chunks[0]?.similarity }, 'RAG chunks retrieved');

  if (chunks.length === 0) {
    return {
      answer: `No relevant documents found in the "${corpus}" corpus. Please make sure documents have been ingested for this corpus.`,
      sources: [],
    };
  }

  // Step 3: Build context from top chunks
  const contextChunks = chunks.map((chunk) => ({
    content: chunk.content,
    source_file: chunk.source_file,
    chunk_index: chunk.chunk_index,
  }));

  // Step 4: Generate response using LLM
  let answer;
  try {
    answer = await generateResponse(question, contextChunks);
  } catch (err) {
    logger.error({ err }, 'Failed to generate LLM response');
    throw new Error(`Failed to generate response: ${err.message}`);
  }

  // Step 5: Build sources array
  const sources = chunks.map((chunk) => ({
    content: chunk.content,
    source_file: chunk.source_file,
    similarity: parseFloat(chunk.similarity),
    chunk_index: chunk.chunk_index,
  }));

  logger.info({ corpus, sourcesCount: sources.length }, 'RAG query complete');

  return { answer, sources };
}

module.exports = { queryRag };
