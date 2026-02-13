#!/usr/bin/env node

/**
 * Ingest site guide content into the RAG system.
 *
 * Reads all pages from the `pages` table and ingests them as the
 * 'guides' corpus so guide content is searchable via the RAG chat.
 *
 * Idempotent — deletes existing 'guides' corpus chunks before
 * re-ingesting so each run produces a fresh index.
 *
 * Requires GEMINI_API_KEY (or GOOGLE_API_KEY) set in environment
 * for the embedding service.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... GEMINI_API_KEY=... node backend/scripts/ingest-guides.js
 *   docker compose exec backend node scripts/ingest-guides.js
 */

const { pool, waitForDb } = require('../src/config/db');
const { ingestText } = require('../src/services/ingestion');
const logger = require('../src/config/logger');

const CORPUS = 'guides';

async function main() {
  console.log('=== Guide Content Ingestion ===\n');

  // 1. Wait for DB connection
  console.log('Connecting to database...');
  await waitForDb();

  // 2. Delete existing guide corpus chunks for idempotency
  console.log(`Clearing existing '${CORPUS}' corpus chunks...`);
  const deleteResult = await pool.query(
    'DELETE FROM document_chunks WHERE corpus = $1',
    [CORPUS]
  );
  console.log(`  Deleted ${deleteResult.rowCount} existing chunk(s).\n`);

  // 3. Query all pages
  console.log('Fetching pages from database...');
  const { rows: pages } = await pool.query(
    'SELECT slug, title, category, content FROM pages ORDER BY sort_order ASC, slug ASC'
  );

  if (pages.length === 0) {
    console.log('No pages found in the database. Run the seed script first:');
    console.log('  docker compose exec backend node scripts/seed.js');
    await pool.end();
    process.exit(0);
  }

  console.log(`Found ${pages.length} page(s) to ingest.\n`);

  // 4. Ingest each page
  let ingested = 0;
  let failed = 0;
  let totalChunks = 0;

  for (const page of pages) {
    const { slug, title, content } = page;

    if (!content || content.trim().length === 0) {
      console.log(`  [skip] ${slug} — empty content`);
      continue;
    }

    try {
      // Prepend the title so the chunk has context about which guide it's from
      const textToIngest = `# ${title}\n\n${content}`;

      console.log(`  [ingest] ${slug} (${content.length} chars)...`);
      const result = await ingestText(textToIngest, CORPUS, slug);
      totalChunks += result.chunks;
      ingested++;
      console.log(`           -> ${result.chunks} chunk(s) created`);
    } catch (err) {
      console.error(`  [FAIL]   ${slug} — ${err.message}`);
      logger.error({ err, slug }, 'Failed to ingest guide page');
      failed++;
    }
  }

  // 5. Summary
  console.log('\n=== Summary ===');
  console.log(`Ingested ${ingested} page(s) into '${CORPUS}' corpus.`);
  console.log(`Total chunks created: ${totalChunks}`);
  if (failed > 0) {
    console.log(`Failed: ${failed} page(s).`);
  }

  // 6. Clean up
  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('Unexpected error:', err);
  try { await pool.end(); } catch (_) { /* ignore */ }
  process.exit(1);
});
