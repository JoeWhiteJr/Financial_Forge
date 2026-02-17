const { Router } = require('express');
const multer = require('multer');
const { pool } = require('../config/db');
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { ingestPdf } = require('../services/ingestion');

const router = Router();

// Multer configuration for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Wrap multer to handle its errors inside the route handler
function handleUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.array('files', 20)(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// POST /api/ingest — Upload and ingest PDFs (admin only, up to 20 files)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    await handleUpload(req, res);
  } catch (err) {
    logger.error({ err }, 'File upload failed');
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, error: 'File too large. Maximum size is 50MB per file.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, error: 'Too many files. Maximum is 20.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err.message === 'Only PDF files are allowed') {
      return res.status(400).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: 'Failed to process upload' });
  }

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No PDF files provided' });
    }

    const { corpus } = req.body;
    if (!corpus) {
      return res.status(400).json({ success: false, error: 'Corpus name is required' });
    }

    logger.info({ corpus, fileCount: req.files.length }, 'Multi-file PDF upload received');

    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const file of req.files) {
      const sourceFile = file.originalname;
      try {
        logger.info({ corpus, sourceFile, fileSize: file.size }, 'Ingesting PDF');
        const result = await ingestPdf(file.buffer, corpus, sourceFile);
        const chunks = result.chunks ?? result.chunk_count ?? 0;
        results.push({ sourceFile, success: true, chunks });
        succeeded++;
      } catch (fileErr) {
        logger.error({ err: fileErr, sourceFile }, 'PDF ingestion failed for file');
        results.push({ sourceFile, success: false, error: fileErr.message || 'Ingestion failed' });
        failed++;
      }
    }

    res.json({
      success: true,
      data: { corpus, total: req.files.length, succeeded, failed, results },
    });
  } catch (err) {
    logger.error({ err }, 'PDF ingestion failed');
    res.status(500).json({ success: false, error: 'Failed to ingest PDFs' });
  }
});

// GET /api/ingest/:corpus/status — Get ingestion status for a corpus (admin only)
router.get('/:corpus/status', auth, adminOnly, async (req, res) => {
  try {
    const { corpus } = req.params;

    const countResult = await pool.query(
      'SELECT COUNT(*) as chunk_count FROM document_chunks WHERE corpus = $1',
      [corpus]
    );

    const filesResult = await pool.query(
      `SELECT DISTINCT source_file, COUNT(*) as chunks, MIN(created_at) as ingested_at
       FROM document_chunks
       WHERE corpus = $1
       GROUP BY source_file
       ORDER BY ingested_at DESC`,
      [corpus]
    );

    res.json({
      success: true,
      data: {
        corpus,
        chunk_count: parseInt(countResult.rows[0].chunk_count, 10),
        source_files: filesResult.rows.map((r) => ({
          source_file: r.source_file,
          chunks: parseInt(r.chunks, 10),
          ingested_at: r.ingested_at,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get ingestion status');
    res.status(500).json({ success: false, error: 'Failed to get ingestion status' });
  }
});

// DELETE /api/ingest/:corpus — Clear all chunks for a corpus (admin only)
router.delete('/:corpus', auth, adminOnly, async (req, res) => {
  try {
    const { corpus } = req.params;

    const result = await pool.query(
      'DELETE FROM document_chunks WHERE corpus = $1',
      [corpus]
    );

    const deletedCount = result.rowCount;
    logger.info({ corpus, deletedCount }, 'Corpus chunks deleted');

    res.json({
      success: true,
      data: {
        corpus,
        deleted: deletedCount,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to delete corpus');
    res.status(500).json({ success: false, error: 'Failed to delete corpus' });
  }
});

module.exports = router;
