# CLAUDE.md — Financial Forge

## Project Overview

**Financial Forge** is a web-based finance research platform for an independent team of 5–15 people. It centralizes investing guides, Bloomberg Terminal documentation, reading lists, market news, and RAG-powered AI chat over multiple document corpora (mentor's newsletters, Warren Buffett letters, Project 2025, and more).

**Repo:** `financial-forge`
**Stack:** React 18 + Vite + Tailwind CSS | Express.js | PostgreSQL 15 + pgvector | Docker
**Reference architecture:** https://github.com/JoeWhiteJr/Utah-Valley-Research-Lab
**Desktop only** — no mobile responsive for MVP.

---

## Project Structure

```
financial-forge/
├── CLAUDE.md                    # This file — agent instructions
├── docker-compose.yml           # Dev environment
├── docker-compose.prod.yml      # Production config
├── .env.example                 # Environment variable template
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint, test, build on PRs
│       └── deploy.yml           # Deploy on merge to main
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── layout/          # NavBar, Footer, PageLayout
│       │   ├── news/            # NewsFeed, NewsCard
│       │   ├── bloomberg/       # CommandCard, CommandSearch, CategoryFilter
│       │   ├── chat/            # ChatWindow, MessageBubble, CorpusSelector, CitationCard
│       │   ├── editor/          # MarkdownEditor (admin content editing)
│       │   ├── auth/            # LoginForm, ProtectedRoute
│       │   └── common/          # Button, Card, SearchBar, MarkdownRenderer, LoadingSpinner
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── SectorAnalysis.jsx
│       │   ├── FinancialAnalysis.jsx
│       │   ├── Valuation.jsx
│       │   ├── BloombergGuide.jsx
│       │   ├── ReadingList.jsx
│       │   ├── Chat.jsx
│       │   ├── Login.jsx        # Login page
│       │   └── Admin.jsx        # Admin dashboard — content editor, CRUD, users, ingestion
│       ├── services/
│       │   └── api.js           # Axios API client (auto-attaches JWT)
│       ├── hooks/
│       │   └── useAuth.js       # Auth hook (login, logout, current user, isAdmin)
│       └── store/
│           └── authStore.js     # Zustand auth state (token, user, isAdmin)
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js             # Express app entry
│   │   ├── config/
│   │   │   ├── db.js            # PostgreSQL connection pool (pg)
│   │   │   └── env.js           # Environment config
│   │   ├── routes/
│   │   │   ├── auth.js          # Login, logout, me
│   │   │   ├── users.js         # User CRUD (admin only)
│   │   │   ├── pages.js         # Content pages CRUD
│   │   │   ├── bloomberg.js     # Bloomberg commands CRUD + search
│   │   │   ├── books.js         # Reading list CRUD
│   │   │   ├── news.js          # News feed endpoint
│   │   │   ├── chat.js          # RAG chat endpoint
│   │   │   └── ingest.js        # Document ingestion endpoint
│   │   ├── services/
│   │   │   ├── rag.js           # RAG pipeline (embed query → search → generate)
│   │   │   ├── ingestion.js     # PDF processing + chunking + embedding
│   │   │   ├── news-fetcher.js  # Finnhub API + RSS aggregation
│   │   │   ├── llm.js           # LLM provider abstraction (Gemini / Anthropic)
│   │   │   └── embeddings.js    # Embedding provider abstraction
│   │   ├── middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── auth.js          # JWT verification middleware
│   │   │   └── adminOnly.js     # Checks is_admin flag after auth
│   │   └── tests/
│   │       ├── routes/
│   │       └── services/
│   └── scripts/
│       ├── migrate.js           # Run database migrations
│       ├── seed.js              # Seed content + Bloomberg commands + books
│       ├── create-admin.js      # Create first admin account (interactive CLI)
│       └── download-buffett.js  # Auto-download Buffett shareholder + partnership letters
├── database/
│   └── migrations/
│       ├── 001_initial_schema.sql  # users, pages, bloomberg_commands, books, news_cache
│       ├── 002_pgvector.sql        # document_chunks with vector extension
│       ├── 003_chat.sql            # chat_sessions, chat_messages
│       └── 004_seed_data.sql       # Initial guide content, Bloomberg commands, books
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── API.md
│   ├── CHANGELOG.md             # All changes documented here
│   └── ERRORS.md                # Error log with resolutions
└── data/
    └── corpora/                 # Raw documents for RAG ingestion
        ├── weekender/           # Cary's ~50+ monthly newsletter PDFs
        ├── buffett/             # Auto-downloaded: shareholder + partnership letters + Superinvestors
        └── project2025/         # Project 2025 PDF
```

---

## Authentication System

### Architecture
- **JWT-based** — Stateless, token stored in localStorage
- **bcrypt** — Password hashing with salt
- **No public registration** — First admin created via CLI script, all other accounts created by admin in dashboard
- **Two levels:** Regular user (`is_admin: false`) and Admin (`is_admin: true`)
- **Public site is fully open** — No login needed to read guides, use chat, view news
- **Only admin routes are protected** — Middleware chain: `auth → adminOnly`

### Auth Middleware Pattern
```javascript
// Public route — no middleware
router.get('/api/pages/:slug', getPage);

// Admin route — requires JWT + is_admin
router.put('/api/pages/:slug', auth, adminOnly, updatePage);
```

### Token Handling (Frontend)
- `api.js` uses an Axios interceptor to attach `Authorization: Bearer <token>` to all requests
- `authStore.js` (Zustand) holds token + user + isAdmin state
- `<ProtectedRoute>` component wraps `/admin` — redirects to `/login` if not admin
- Nav bar shows "Login" when logged out, shows user name + "Admin" link + "Logout" when logged in as admin

### First Admin Setup
```bash
# Interactive CLI — prompts for email, name, password
docker compose exec backend node scripts/create-admin.js
```

### Future Upgrade Path → Full Roles
When ready, the upgrade is straightforward:
1. Add `role` column to users table (`admin`, `contributor`, `viewer`)
2. Migrate: `UPDATE users SET role = 'admin' WHERE is_admin = true`
3. Update `adminOnly` middleware to check `role` instead of `is_admin`
4. Add `contributorOrAdmin` middleware for content editing
5. Drop `is_admin` column

---

## Agent Roles & Workflow

This project uses a **3-agent model**.

### Agent 1: Developer Agent
- **Role:** Writes code, implements features, fixes bugs
- **Workflow:**
  1. Read this CLAUDE.md fully before starting any work
  2. `git pull origin main`
  3. Create branch: `git checkout -b feature/<n>` or `fix/<n>`
  4. Implement in small, logical commits
  5. Run all tests before pushing
  6. `git push -u origin <branch-name>`
  7. Create a Pull Request targeting `main`
  8. Wait for Reviewer Agent feedback

### Agent 2: Reviewer Agent
- **Role:** Reviews PRs, runs tests, identifies bugs
- **Workflow:**
  1. Pull PR branch locally
  2. Read PR description + all changed files
  3. Run full test suite
  4. Check for: bugs, security issues, missing error handling, missing tests
  5. Leave specific, actionable feedback
  6. Approve or request changes

### Agent 3: Coordinator (Human)
- **Role:** Prioritizes work, makes architecture decisions, merges PRs, uploads documents
- **Workflow:**
  1. Assigns tasks to Developer Agent
  2. Reviews feedback
  3. Merges to `main`
  4. Monitors CHANGELOG.md and ERRORS.md

---

## Git Standards

### Branch Naming
- `feature/<short-description>` — New features
- `fix/<short-description>` — Bug fixes
- `hotfix/<short-description>` — Urgent production fixes
- `chore/<short-description>` — Config, deps, docs

### Commit Messages
```
feat: add Bloomberg command search with category filter
fix: resolve news feed caching race condition
docs: update API documentation for chat endpoint
test: add integration tests for RAG pipeline
chore: update Tailwind to v3.4
refactor: extract embedding logic into separate service
```

### Pull Request Requirements
Every PR must include:
1. **Description:** What changed and why
2. **Testing:** What tests were added or run
3. **Checklist:**
   - [ ] Tests pass (`npm test`)
   - [ ] No lint errors (`npm run lint`)
   - [ ] CHANGELOG.md updated
   - [ ] ERRORS.md updated (if errors encountered)
   - [ ] No hardcoded secrets or API keys

### Merge Rules
- Never push directly to `main`
- PRs require Reviewer Agent approval
- Squash merge preferred
- Delete branch after merge

---

## Coding Standards

### General
- JavaScript/JSX (no TypeScript for MVP)
- ESLint + Prettier
- `async/await` over callbacks
- Comments for "why", not "what"

### Frontend
- Functional components only
- Zustand for global state (minimal — auth store, plus any needed)
- Tailwind CSS for all styling
- PascalCase component files
- One component per file
- API calls through `services/api.js` only (includes auth interceptor)

### Backend
- Express Router — one file per resource
- All handlers wrapped in try/catch
- Parameterized database queries only (never string concatenation)
- Consistent JSON responses: `{ success: true, data }` or `{ success: false, error }`
- Environment variables only through `config/env.js`
- Business logic in `services/`, not in route files
- Auth middleware applied per-route, not globally (public routes stay open)

### Database
- All changes via numbered migration files
- Never modify existing migrations
- UUIDs for primary keys
- All tables have `created_at`
- Passwords NEVER stored in plain text — bcrypt only

---

## Testing Standards

### What to Test
- **Auth:** Login success, login failure, expired token, admin middleware rejection, non-admin accessing admin route
- Backend routes: happy path + error path per endpoint
- Backend services: unit tests with mocked deps (especially RAG, ingestion)
- Frontend: rendering tests for complex components (chat, bloomberg search, login form)

### Running Tests
```bash
cd backend && npm test        # Jest
cd frontend && npm run lint   # ESLint
```

### Before Every PR
1. All existing tests pass
2. New features include basic tests
3. Bug fixes include regression test
4. Failures documented in ERRORS.md

---

## Documentation Standards

### CHANGELOG.md
```markdown
## [Unreleased]
### Added
- Bloomberg command search with category filtering (#PR)
### Fixed
- News feed cache expiration not resetting (#PR)
```

### ERRORS.md
```markdown
## 2025-02-13: pgvector installation failure

**Error:** CREATE EXTENSION vector fails
**Cause:** Base PostgreSQL image doesn't include pgvector
**Resolution:** Switch to pgvector/pgvector:pg15 Docker image
**PR:** #12
**Time to resolve:** 30 minutes
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_forge
PGVECTOR_DIMENSIONS=768

# Auth
JWT_SECRET=             # Random string, min 32 chars. Generate: openssl rand -hex 32
JWT_EXPIRY=7d           # Token expiration

# LLM Provider: "gemini" (free dev) or "anthropic" (production)
LLM_PROVIDER=gemini
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# Embedding Provider: "google" (free) or "openai"
EMBEDDING_PROVIDER=google
GOOGLE_API_KEY=
OPENAI_API_KEY=

# News
FINNHUB_API_KEY=

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# RAG Config
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50
RAG_TOP_K=5
```

---

## Development Setup

```bash
# 1. Clone
git clone <repo-url>
cd financial-forge

# 2. Environment
cp .env.example .env
# Fill in: GEMINI_API_KEY, FINNHUB_API_KEY, JWT_SECRET

# 3. Start
docker compose up

# 4. Migrate (first time)
docker compose exec backend node scripts/migrate.js

# 5. Create your admin account (first time)
docker compose exec backend node scripts/create-admin.js
# Prompts: email, name, password → creates account with is_admin=true

# 6. Seed content + Bloomberg commands + books
docker compose exec backend node scripts/seed.js

# 7. Download Buffett letters (first time, Phase 4)
docker compose exec backend node scripts/download-buffett.js

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Health:   http://localhost:3001/api/health
# Login:    http://localhost:5173/login
# Admin:    http://localhost:5173/admin (requires login as admin)
```

---

## Key Architecture Decisions

1. **pgvector over dedicated vector DB** — One DB for everything. Good enough for <100k chunks.
2. **LLM provider abstraction** — `LLM_PROVIDER` env var switches between Gemini (free dev) and Anthropic (paid prod). Same for embeddings via `EMBEDDING_PROVIDER`.
3. **JWT auth with admin flag** — Simple two-level auth. No public registration. Admin creates accounts. Public site stays open. Future upgrade to full roles (Admin/Contributor/Viewer) is a clean migration.
4. **Markdown content** — Guide pages stored as Markdown in DB, rendered with react-markdown. Editable via `/admin`.
5. **News caching** — Server-side fetch every 30 min, cached in DB. Frontend reads cache.
6. **Admin dashboard** — `/admin` route requires login + is_admin. Content editor, CRUD, user management, PDF ingestion all in one place.
7. **Buffett auto-download** — `scripts/download-buffett.js` scrapes berkshirehathaway.com for all shareholder letters + pulls partnership letters from public sources.

---

## Task Prioritization

### Sprint 1: Skeleton + Auth
- [ ] Docker Compose (React + Express + PostgreSQL/pgvector)
- [ ] All database migrations (including users table)
- [ ] Express API scaffolding + health check
- [ ] Auth system: JWT login, bcrypt, auth + adminOnly middleware
- [ ] `create-admin.js` CLI script
- [ ] React app + routing + nav bar + "Financial Forge" branding
- [ ] Login page + auth store + ProtectedRoute component
- [ ] Home page layout (placeholder)
- [ ] Page content API + markdown renderer

### Sprint 2: Content & Admin Dashboard
- [ ] Claude-draft guide content (sector analysis, financial analysis, valuation)
- [ ] `/admin` dashboard: content editor, Bloomberg CRUD, books CRUD, user management
- [ ] Admin route protection (frontend ProtectedRoute + backend middleware)
- [ ] Bloomberg Guide page with search/filter
- [ ] Reading List page + seed data
- [ ] Finnhub + RSS news integration
- [ ] News feed on home page

### Sprint 3: RAG Chat
- [ ] LLM provider abstraction (Gemini/Anthropic)
- [ ] Embedding provider abstraction
- [ ] PDF ingestion pipeline (upload → extract → chunk → embed → store)
- [ ] RAG query service (embed → search → generate with citations)
- [ ] Chat API endpoints
- [ ] Chat UI ("Ask the Forge") with corpus dropdown
- [ ] Admin: PDF upload for ingestion
- [ ] Ingest first corpus (Weekender PDFs)

### Sprint 4: Full Load + Polish
- [ ] Buffett letter download script
- [ ] Ingest all Buffett content
- [ ] Ingest Project 2025
- [ ] Auto-ingest site guide content
- [ ] Home page polish (Weekender highlight, quick links)
- [ ] Error handling + loading states
- [ ] Deploy
- [ ] Demo to Cary

---

## Agent Communication Protocol

### Task Assignment (Coordinator → Developer)
```
TASK: [what to build]
FILES: [likely files involved]
CRITERIA: [what "done" looks like]
PRIORITY: high | medium | low
```

### PR Description (Developer → Coordinator)
```
## What
[What was done]

## Why
[Why this approach]

## Not Done
[What was skipped and why]

## Blockers
[Anything needing input]
```

### Error Logging (Any Agent → ERRORS.md)
Every error: date, description, root cause, resolution, time spent, PR reference.

---

## Important Notes

- **MVP mindset** — Working features over polish. Clean code matters, pixel-perfect does not.
- **No premature optimization** — Get it working first.
- **Ask before architecting** — New libraries or services need Coordinator approval.
- **Document everything** — Bugs, workarounds, non-obvious decisions → ERRORS.md or code comments.
- **Provider abstraction is critical** — Gemini for dev ($0), Anthropic for prod. The switch must be a single env var change.
- **Auth is per-route** — Public routes stay open. Only admin routes get middleware. Never apply auth globally.
- **Passwords are sacred** — bcrypt only, never log or expose passwords, never store plain text.
- **JWT_SECRET must be strong** — Generate with `openssl rand -hex 32`, never commit to repo.
