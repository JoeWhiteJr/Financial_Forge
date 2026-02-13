const pdfParse = require('pdf-parse');
const { pool } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');
const { embedDocument } = require('./embeddings');

/**
 * Split text into chunks using a character-based sliding window.
 * Attempts to split on sentence/paragraph boundaries when possible.
 * @param {string} text - The full text to split
 * @param {number} chunkSize - Target chunk size in characters
 * @param {number} chunkOverlap - Overlap between consecutive chunks in characters
 * @returns {string[]} Array of text chunks
 */
function splitTextIntoChunks(text, chunkSize, chunkOverlap) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;

    if (end >= cleaned.length) {
      // Last chunk: take everything remaining
      chunks.push(cleaned.slice(start).trim());
      break;
    }

    // Try to find a good break point near the end of the chunk
    // Look for paragraph break, then sentence end, then word boundary
    let breakPoint = end;

    // Look for paragraph break (double newline or period followed by space) in the last 20% of chunk
    const searchStart = Math.max(start, end - Math.floor(chunkSize * 0.2));
    const searchRegion = cleaned.slice(searchStart, end);

    // Try sentence boundary (. ! ? followed by space)
    const sentenceBreak = searchRegion.lastIndexOf('. ');
    const exclamationBreak = searchRegion.lastIndexOf('! ');
    const questionBreak = searchRegion.lastIndexOf('? ');
    const bestSentenceBreak = Math.max(sentenceBreak, exclamationBreak, questionBreak);

    if (bestSentenceBreak > 0) {
      breakPoint = searchStart + bestSentenceBreak + 2; // +2 to include the punctuation and space
    } else {
      // Fall back to word boundary
      const lastSpace = searchRegion.lastIndexOf(' ');
      if (lastSpace > 0) {
        breakPoint = searchStart + lastSpace + 1;
      }
      // If no space found, just cut at chunkSize
    }

    const chunk = cleaned.slice(start, breakPoint).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, accounting for overlap
    start = breakPoint - chunkOverlap;
    // Safety: ensure we always make forward progress
    if (start <= (breakPoint - chunkSize)) {
      start = breakPoint;
    }
  }

  return chunks;
}

/**
 * Ingest a PDF buffer into the document_chunks table.
 * @param {Buffer} buffer - The PDF file buffer
 * @param {string} corpus - The corpus/collection name
 * @param {string} sourceFile - Original filename
 * @returns {Promise<{chunks: number, corpus: string, sourceFile: string}>}
 */
async function ingestPdf(buffer, corpus, sourceFile) {
  logger.info({ corpus, sourceFile }, 'Starting PDF ingestion');

  // Extract text from PDF
  let pdfData;
  try {
    pdfData = await pdfParse(buffer);
  } catch (err) {
    logger.error({ err, sourceFile }, 'Failed to parse PDF');
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }

  const text = pdfData.text;
  if (!text || text.trim().length === 0) {
    throw new Error('PDF contains no extractable text');
  }

  logger.info({ corpus, sourceFile, textLength: text.length, pages: pdfData.numpages }, 'PDF text extracted');

  return ingestText(text, corpus, sourceFile);
}

/**
 * Ingest plain text into the document_chunks table.
 * @param {string} text - The text to ingest
 * @param {string} corpus - The corpus/collection name
 * @param {string} sourceFile - Source identifier
 * @returns {Promise<{chunks: number, corpus: string, sourceFile: string}>}
 */
async function ingestText(text, corpus, sourceFile) {
  const chunkSize = env.ragChunkSize;
  const chunkOverlap = env.ragChunkOverlap;

  // Split into chunks
  const chunks = splitTextIntoChunks(text, chunkSize, chunkOverlap);
  logger.info({ corpus, sourceFile, chunkCount: chunks.length, chunkSize, chunkOverlap }, 'Text split into chunks');

  if (chunks.length === 0) {
    throw new Error('No chunks generated from text');
  }

  let successCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    try {
      // Generate embedding for this chunk
      const embedding = await embedDocument(chunks[i]);

      // Format embedding as pgvector string: [0.1, 0.2, ...]
      const embeddingStr = `[${embedding.join(',')}]`;

      // Insert into document_chunks
      await pool.query(
        `INSERT INTO document_chunks (corpus, source_file, page_number, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7)`,
        [
          corpus,
          sourceFile,
          null, // page_number: null for now
          i,
          chunks[i],
          embeddingStr,
          JSON.stringify({ chunk_size: chunks[i].length, total_chunks: chunks.length }),
        ]
      );

      successCount++;
      if ((i + 1) % 10 === 0) {
        logger.info({ corpus, sourceFile, progress: `${i + 1}/${chunks.length}` }, 'Ingestion progress');
      }
    } catch (err) {
      logger.error({ err, corpus, sourceFile, chunkIndex: i }, 'Failed to ingest chunk, continuing');
      // Continue with next chunk — don't fail the whole batch
    }
  }

  logger.info({ corpus, sourceFile, successCount, totalChunks: chunks.length }, 'Ingestion complete');

  return {
    chunks: successCount,
    corpus,
    sourceFile,
  };
}

module.exports = { ingestPdf, ingestText };
