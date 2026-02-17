# Changelog

All notable changes to Financial Forge are documented in this file.

## [Unreleased]

### Added
- Multi-file PDF upload (up to 20 files at once) in admin ingestion tab
- Corpus selector with "Existing corpus" dropdown and "Create new" option
- Upload progress bar during file transfer
- Per-file ingestion results with success/failure indicators and chunk counts
- 10-minute upload timeout for large batch ingestions

### Changed
- Backend ingest endpoint accepts `files` array instead of single `file`
- Backend processes files sequentially with per-file error handling (one failure doesn't abort batch)
- Ingest API response now returns `{ corpus, total, succeeded, failed, results }` format

### Fixed
- Multer errors (too many files, file too large, non-PDF) now return proper 4xx responses instead of generic 500 (bd1699a)

## Sprint 4 — Polish, Scripts, and Production Config

### Added
- Vercel + Render + Supabase deployment configuration (#5)
- Production Dockerfile and docker-compose.prod.yml
- Uncommitted production features (3e0e078)

### Fixed
- Use `npm start` in production Dockerfile (6df5dfb)

## Sprint 3 — RAG Chat Pipeline

### Added
- RAG chat pipeline and "Ask the Forge" UI (#3)
- LLM provider abstraction (Gemini / Anthropic)
- Embedding provider abstraction
- PDF ingestion pipeline (upload, extract, chunk, embed, store)
- Chat API endpoints and chat UI with corpus dropdown
- Admin PDF upload for ingestion
- Switched LLM to Anthropic Claude Sonnet 4.5
- Switched embeddings to Voyage AI voyage-finance-2
- Ingested Weekender PDFs

## Sprint 1+2 — Foundation, Auth, Content, and Admin Dashboard

### Added
- Docker Compose environment (React + Express + PostgreSQL/pgvector)
- Database migrations (users, pages, bloomberg_commands, books, document_chunks, chat)
- JWT authentication with bcrypt password hashing
- Admin dashboard: content editor, Bloomberg CRUD, books CRUD, user management
- Bloomberg Guide page with search/filter
- Reading List page with seed data
- News feed integration (Finnhub + RSS)
- CI workflow for PRs and main (#2)
- CLAUDE.md project instructions
- PROJECT_PLAN.md specification
