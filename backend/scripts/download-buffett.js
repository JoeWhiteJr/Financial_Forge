#!/usr/bin/env node

/**
 * Download Buffett shareholder letters from berkshirehathaway.com.
 *
 * Fetches the letters index page, parses PDF links, and downloads
 * each letter to data/corpora/buffett/. Idempotent — skips files
 * that already exist on disk.
 *
 * Uses only Node.js built-in modules (no external dependencies).
 *
 * Usage:
 *   node backend/scripts/download-buffett.js
 *   docker compose exec backend node scripts/download-buffett.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const LETTERS_PAGE_URL = 'https://www.berkshirehathaway.com/letters/letters.html';
const BASE_URL = 'https://www.berkshirehathaway.com';
const OUTPUT_DIR = path.resolve(__dirname, '../../data/corpora/buffett');

// ---------------------------------------------------------------------------
// HTTP helpers (built-in modules only)
// ---------------------------------------------------------------------------

/**
 * Fetch a URL and return the response body as a string or Buffer.
 * Follows redirects (up to 5). Returns a Promise.
 */
function fetch(url, { binary = false, maxRedirects = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (maxRedirects <= 0) {
          return reject(new Error(`Too many redirects for ${url}`));
        }
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        return resolve(fetch(redirectUrl, { binary, maxRedirects: maxRedirects - 1 }));
      }

      if (res.statusCode !== 200) {
        res.resume(); // drain
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve(binary ? buf : buf.toString('utf8'));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Download a file to disk. Returns true on success, false on failure.
 */
async function downloadFile(url, destPath) {
  const data = await fetch(url, { binary: true });
  fs.writeFileSync(destPath, data);
  return true;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse the letters.html page and extract PDF link paths.
 * The page has links like:
 *   <a href="/letters/2023ltr.pdf">2023</a>
 *   <a href="/letters/2005ltr.pdf">2005</a>
 *   <a href="letters/1977.html">1977</a>  (HTML versions — skip)
 *
 * We only want .pdf links.
 */
function parsePdfLinks(html) {
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']*\.pdf)["'][^>]*>/gi;
  const links = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];

    // Normalize path: ensure it starts with /
    if (!href.startsWith('/') && !href.startsWith('http')) {
      href = '/letters/' + href;
    }

    // Build full URL
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    // Deduplicate
    if (!links.includes(fullUrl)) {
      links.push(fullUrl);
    }
  }

  return links;
}

/**
 * Extract a human-readable label from a PDF filename.
 * e.g. "2023ltr.pdf" -> "2023", "1999ar.pdf" -> "1999"
 */
function labelFromFilename(filename) {
  const yearMatch = filename.match(/(\d{4})/);
  return yearMatch ? yearMatch[1] : filename.replace('.pdf', '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Buffett Letter Downloader ===\n');

  // 1. Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // 2. Fetch the letters index page
  console.log(`Fetching letter index: ${LETTERS_PAGE_URL}`);
  let html;
  try {
    html = await fetch(LETTERS_PAGE_URL);
  } catch (err) {
    console.error(`Failed to fetch letters page: ${err.message}`);
    console.error('Check your internet connection and try again.');
    process.exit(1);
  }

  // 3. Parse PDF links
  const pdfUrls = parsePdfLinks(html);
  console.log(`Found ${pdfUrls.length} PDF link(s) on the letters page.\n`);

  if (pdfUrls.length === 0) {
    console.warn('No PDF links found. The page structure may have changed.');
    console.warn('Check https://www.berkshirehathaway.com/letters/letters.html manually.');
  }

  // 4. Download each PDF
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of pdfUrls) {
    const filename = path.basename(url);
    const destPath = path.join(OUTPUT_DIR, filename);
    const label = labelFromFilename(filename);

    if (fs.existsSync(destPath)) {
      console.log(`  Already exists: ${filename}`);
      skipped++;
      continue;
    }

    try {
      console.log(`  Downloading ${label} letter... (${filename})`);
      await downloadFile(url, destPath);
      downloaded++;
    } catch (err) {
      console.error(`  FAILED: ${filename} — ${err.message}`);
      failed++;
    }
  }

  // 5. Partnership letters notice
  console.log('\n--- Partnership Letters ---');
  console.log('Partnership letters (1957-1969) are not available on berkshirehathaway.com.');
  console.log('Partnership letters must be manually added to data/corpora/buffett/');
  console.log('If you have them as PDFs, place them in the directory above and run ingestion.');

  // 6. Summary
  console.log('\n=== Summary ===');
  console.log(`Downloaded ${downloaded} new letter(s), ${skipped} already existed, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
