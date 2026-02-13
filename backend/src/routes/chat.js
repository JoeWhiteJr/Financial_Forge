const { Router } = require('express');
const { pool } = require('../config/db');
const logger = require('../config/logger');
const { queryRag } = require('../services/rag');

const router = Router();

// GET /api/chat/corpora/list — List available corpora (public)
// IMPORTANT: This must be defined BEFORE /:session_id to avoid the path param catching "corpora"
router.get('/corpora/list', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT corpus, COUNT(*) as chunks FROM document_chunks GROUP BY corpus'
    );
    res.json({
      success: true,
      data: rows.map((r) => ({ corpus: r.corpus, chunks: parseInt(r.chunks, 10) })),
    });
  } catch (err) {
    logger.error({ err }, 'Failed to list corpora');
    res.status(500).json({ success: false, error: 'Failed to list corpora' });
  }
});

// POST /api/chat — Send a message (public)
router.post('/', async (req, res) => {
  try {
    const { message, corpus, session_id } = req.body;

    if (!message || !corpus) {
      return res.status(400).json({ success: false, error: 'Message and corpus are required' });
    }

    let sessionId = session_id;

    // If no session_id, create a new chat session
    if (!sessionId) {
      const { rows } = await pool.query(
        `INSERT INTO chat_sessions (corpus)
         VALUES ($1)
         RETURNING id`,
        [corpus]
      );
      sessionId = rows[0].id;
      logger.info({ sessionId, corpus }, 'New chat session created');
    }

    // Call RAG pipeline
    const { answer, sources } = await queryRag(message, corpus);

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)`,
      [sessionId, 'user', message]
    );

    // Save assistant response (store sources in metadata or as JSON in content)
    await pool.query(
      `INSERT INTO chat_messages (session_id, role, content, sources)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, 'assistant', answer, JSON.stringify(sources)]
    );

    res.json({
      success: true,
      data: {
        session_id: sessionId,
        message: {
          role: 'assistant',
          content: answer,
          sources,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, 'Chat message failed');
    res.status(500).json({ success: false, error: 'Failed to process chat message' });
  }
});

// GET /api/chat/:session_id — Get chat history (public)
router.get('/:session_id', async (req, res) => {
  try {
    const { session_id } = req.params;

    // Verify session exists
    const session = await pool.query(
      'SELECT id, corpus, created_at FROM chat_sessions WHERE id = $1',
      [session_id]
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    // Get all messages ordered by created_at
    const { rows: messages } = await pool.query(
      `SELECT id, role, content, sources, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session_id]
    );

    res.json({
      success: true,
      data: {
        session: session.rows[0],
        messages,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get chat history');
    res.status(500).json({ success: false, error: 'Failed to get chat history' });
  }
});

module.exports = router;
