const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const { pool, waitForDb } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const pagesRoutes = require('./routes/pages');
const usersRoutes = require('./routes/users');
const bloombergRoutes = require('./routes/bloomberg');
const booksRoutes = require('./routes/books');
const newsRoutes = require('./routes/news');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bloomberg', bloombergRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/news', newsRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Error handler
app.use(errorHandler);

// Start
async function start() {
  await waitForDb();
  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`Backend listening on port ${env.port}`);
  });
}

start().catch(err => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
