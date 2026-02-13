#!/usr/bin/env node

/**
 * Batch-ingest Cary Wasden Weekender PDFs into the RAG system.
 * Reads PDFs from /data/weekender, ingests into the "weekender" corpus.
 * Includes rate-limit handling with delays between files.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');
const { ingestPdf } = require('../src/services/ingestion');

const PDF_DIR = '/data/weekender';
const CORPUS = 'weekender';
const DELAY_BETWEEN_FILES_MS = 2000; // 2s pause between files (throttle is per-chunk now)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Weekender PDF Ingestion ===\n');

  // Verify directory exists
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`Directory not found: ${PDF_DIR}`);
    console.error('Make sure the Weekender directory is mounted at /data/weekender');
    process.exit(1);
  }

  // Get all PDF files (skip Zone.Identifier files)
  const files = fs.readdirSync(PDF_DIR)
    .filter((f) => f.endsWith('.pdf'))
    .sort();

  console.log(`Found ${files.length} PDF(s) in ${PDF_DIR}\n`);

  if (files.length === 0) {
    console.log('No PDFs found. Nothing to ingest.');
    process.exit(0);
  }

  // Clear existing weekender corpus (re-embed with new provider)
  console.log(`Clearing existing '${CORPUS}' corpus chunks...`);
  const { rowCount } = await pool.query(
    'DELETE FROM document_chunks WHERE corpus = $1',
    [CORPUS]
  );
  console.log(`  Deleted ${rowCount} existing chunk(s).\n`);

  let totalChunks = 0;
  let successFiles = 0;
  let failedFiles = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(PDF_DIR, file);

    console.log(`  [${i + 1}/${files.length}] ${file}...`);

    try {
      const buffer = fs.readFileSync(filePath);
      const result = await ingestPdf(buffer, CORPUS, file);
      console.log(`           -> ${result.chunks} chunk(s) created`);
      totalChunks += result.chunks;
      successFiles++;
    } catch (err) {
      console.error(`           -> FAILED: ${err.message}`);
      failedFiles.push(file);
    }

    // Delay between files to avoid rate limits (skip after last file)
    if (i < files.length - 1) {
      await sleep(DELAY_BETWEEN_FILES_MS);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Ingested ${successFiles}/${files.length} PDF(s) into '${CORPUS}' corpus.`);
  console.log(`Total chunks created: ${totalChunks}`);
  if (failedFiles.length > 0) {
    console.log(`Failed files: ${failedFiles.join(', ')}`);
  }

  await pool.end();
  process.exit(failedFiles.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
