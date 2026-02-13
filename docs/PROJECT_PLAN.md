# Financial Forge — Project Plan

## Project Overview

**Financial Forge** is a web-based finance research platform for an independent team of 5–15 people. It serves as a centralized hub replacing scattered Google Drive files and emails with structured investing guides, Bloomberg Terminal documentation, curated reading lists, live market news, and AI-powered document Q&A (RAG models). The platform is built for daily use — team members use it to learn, reference material during analysis, and query RAG models to develop their own investment theses.

**Mentor:** Cary — former #1-ranked financial analyst, university professor, writes a monthly newsletter ("The Weekender") with market outlook and analysis. His content is a core knowledge base for the RAG system.

**Philosophy:** Ship an MVP fast. Everyone knows it's under development. Polish comes later. Content guides will be drafted by Claude and reviewed/edited by the team over time.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS | Matches reference repo, fast dev cycle |
| Backend | Node.js + Express.js | Matches reference repo, JavaScript full-stack |
| Database | PostgreSQL 15 + pgvector | Structured content + vector search in one DB |
| Auth | JWT (jsonwebtoken) + bcrypt | Simple, stateless, no external auth service |
| RAG / AI (Dev) | Gemini API (free tier, 250k tokens/mo) | $0 during development |
| RAG / AI (Production) | Anthropic Claude Sonnet API (~$5-20/mo) | Better quality, swap via config |
| Embeddings | Google text-embedding (free tier) → swap later | Match the LLM provider |
| News Data | Finnhub API (free tier) + RSS feeds | Free, reliable market coverage |
| Containerization | Docker + Docker Compose | Consistent environments |
| Deployment | TBD (Docker on VPS / EC2) | Decide after MVP works locally |
| CI/CD | GitHub Actions | Matches reference repo |
| Desktop Only | No mobile responsive for MVP | Future consideration |

### API Cost Estimate (Production)
| Usage Level | Monthly Cost |
|------------|-------------|
| Light (5 users, casual queries) | ~$5 |
| Moderate (10 users, daily use) | ~$10-15 |
| Heavy (15 users, frequent RAG queries) | ~$20-30 |

---

## Site Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  FINANCIAL FORGE                                              │
│  [Home] [Sector Analysis] [Financial Analysis]                │
│  [Company Valuation] [Bloomberg Guide] [Reading List] [Chat]  │
│                                              [Login] [Admin]  │
└──────────────────────────────────────────────────────────────┘

Public (no login required):        Admin (login + is_admin required):
  - Home page + news                 - /admin content editor
  - All guide pages                  - Bloomberg command CRUD
  - Bloomberg Guide (read)           - Reading list CRUD
  - Reading List (read)              - PDF upload for RAG ingestion
  - AI Chat ("Ask the Forge")        - User management (promote/demote admins)
  - Login page
```

### 1. Home Page (`/`)
- Market News Feed — Latest headlines from Finnhub API + RSS
- Quick Links — Jump to popular guides
- AI Chat Callout — "Ask the Forge" prominent link
- Cary's Latest Weekender — Most recent edition summary/link

### 2. Sector Analysis (`/sector-analysis`)
- Step-by-step sector analysis guide
- Key metrics by sector (tech, healthcare, energy, financials, etc.)
- Framework for presenting analysis
- Claude-drafted, editable via admin editor

### 3. Financial Analysis (`/financial-analysis`)
- Ratio Guides by category:
  - Liquidity (current ratio, quick ratio, cash ratio)
  - Profitability (ROE, ROA, net margin, gross margin)
  - Leverage (D/E, interest coverage, debt/EBITDA)
  - Efficiency (asset turnover, inventory turnover, receivable days)
  - Valuation (P/E, P/B, EV/EBITDA, PEG)
- How to read financial statements
- DuPont analysis walkthrough
- Comparable company analysis
- Claude-drafted, editable via admin editor

### 4. Company Valuation (`/valuation`)
- DCF model walkthrough with formulas
- Comps guide
- Precedent transactions guide
- Sensitivity analysis
- Links to templates / spreadsheets
- Claude-drafted, editable via admin editor

### 5. Bloomberg Guide (`/bloomberg`)
- Structured by topic:
  - **Equity Research**: `EQ`, `FA`, `RV`, `SPLC`, `GIP`, `ANR`
  - **Fixed Income**: `FI`, `RATD`, `FXIP`, `SRCH`
  - **Economics**: `ECOF`, `WECO`, `GP`, `ECST`
  - **News & Events**: `TOP`, `NI`, `ECO`, `ERN`, `BRC`
  - **Portfolio & Analytics**: `PORT`, `MARS`, `PMEN`
  - **Excel Integration**: `BDH`, `BDP`, `BDS` formulas
- Each command: name, description, when to use, related commands
- Search and category filter
- Source: Team documents from Bloomberg Terminal in lab + free cheat sheets

### 6. Reading List (`/reading-list`)
- Books categorized by topic with difficulty levels
- Initial list:
  - *Principles for Dealing with the Changing World Order* — Ray Dalio (Macro)
  - *Best Practices for Equity Research Analysts* — James Valentine (Equity Research)
  - *The Richest Man in Babylon* — George S. Clason (Foundations)
- Expandable via admin

### 7. AI Research Chat — "Ask the Forge" (`/chat`)
- Unified chat with knowledge base dropdown:
  - **Cary's Weekender** — RAG over ~50+ monthly newsletter PDFs
  - **Warren Buffett** — Shareholder letters (1977–present) + partnership letters (1957–1970) + Superinvestors essay
  - **Project 2025** — Economic/fiscal policy impact on markets focus
  - **Finance Guides** — Site's own guide content
  - **Bloomberg Guide** — Command database
- Source citations with each response
- Chat history per session

### 8. Login (`/login`)
- Email + password login form
- JWT token stored in localStorage
- Redirects to home after login
- "Login" link in nav bar (changes to user name + "Logout" when logged in)
- No public registration — admin creates accounts

### 9. Admin Dashboard (`/admin`) — requires login + is_admin
- **Content Editor** — Select any page, edit markdown, live preview, save
- **Bloomberg CRUD** — Add/edit/delete commands
- **Reading List CRUD** — Add/edit/delete books
- **PDF Ingestion** — Upload PDFs to a corpus, view ingestion status
- **User Management** — Create new accounts, toggle admin flag, reset passwords
- Admin link only visible in nav when logged in as admin

---

## Authentication System

### How It Works (MVP)
- **JWT-based** — Stateless, token in localStorage, sent as `Authorization: Bearer <token>` header
- **bcrypt** password hashing — Industry standard, salted
- **No public registration** — You (first admin) are seeded via script. You create accounts for others through the admin panel.
- **Two levels: regular user and admin** — `is_admin` boolean on the users table
- **Public site stays fully open** — No login needed to read guides, browse Bloomberg commands, use the chat, or view news
- **Only `/admin` routes are protected** — Backend middleware checks JWT + is_admin flag

### Auth Flow
```
1. You run seed script → creates your account (first admin)
2. You log in at /login → get JWT token
3. You go to /admin → create accounts for 1-2 other devs with is_admin=true
4. They log in → can access /admin
5. Everyone else uses the public site without logging in
```

### Future: Full Role System
When the team grows, upgrade to role-based access:
- **Admin** — Full access (content, users, ingestion)
- **Contributor** — Can edit content and Bloomberg commands, cannot manage users
- **Viewer** — Read-only (same as unauthenticated, but with a saved identity for chat history etc.)

This upgrade path is clean: add a `role` column to replace `is_admin`, update middleware to check roles instead of boolean. No major refactor needed.

---

## Content Strategy

1. Claude drafts initial guide content (sector analysis, financial analysis, valuation)
2. You review and edit via the `/admin` content editor
3. Content stored as Markdown in database
4. Editable anytime — no code changes needed
5. Team members see the published version, admins edit behind the scenes

---

## RAG Architecture

```
PDF Upload → Text Extraction → Chunking (500 tokens, 50 overlap) → Embedding → pgvector
                                                                                    ↓
User Question → Embed → Cosine Similarity → Top-5 Chunks → LLM with Context → Response + Citations
```

### LLM Provider Abstraction
```
LLM_PROVIDER=gemini      # Development ($0)
LLM_PROVIDER=anthropic   # Production (~$5-20/mo)
```

### Embedding Provider Abstraction
```
EMBEDDING_PROVIDER=google    # Free tier
EMBEDDING_PROVIDER=openai    # If needed later
```

### Document Corpora

| Corpus | Source | Format | Est. Size | Priority |
|--------|--------|--------|-----------|----------|
| Cary's Weekender | Uploaded by admin | ~50+ PDFs | ~250-500 pages | **Highest** |
| Buffett Shareholder Letters | Auto-downloaded from berkshirehathaway.com | ~47 PDFs (1977–present) | ~800+ pages | **High** |
| Buffett Partnership Letters | Publicly available, auto-downloaded | PDFs (1957–1970) | ~200 pages | **High** |
| Superinvestors Essay | Columbia Business School | ~1 PDF | ~20 pages | Medium |
| Project 2025 | Project2025.org | 1 large PDF | ~900 pages | **High** |
| Finance Guides | Auto-generated from DB | Markdown → text | Growing | Medium |
| Bloomberg Commands | DB export | Structured text | Small, growing | Low |

### Buffett Letter Download Script
`scripts/download-buffett.js` will:
1. Scrape Berkshire Hathaway shareholder letters page
2. Download all annual letters (1977–present) as PDFs
3. Download partnership letters from known public sources
4. Save to `data/corpora/buffett/`

---

## Database Schema

```sql
-- Users (basic auth with admin flag)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Content pages (guides) — editable via /admin
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bloomberg commands
CREATE TABLE bloomberg_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    when_to_use TEXT,
    related_commands TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reading list
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255),
    category VARCHAR(100),
    summary TEXT,
    difficulty VARCHAR(50),
    why_it_matters TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- News cache (refreshed every 30 min server-side)
CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100),
    title VARCHAR(500),
    url TEXT,
    summary TEXT,
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW()
);

-- RAG vector store
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corpus VARCHAR(100) NOT NULL,
    source_file VARCHAR(500),
    page_number INTEGER,
    chunk_index INTEGER,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corpus VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Auth
- `POST /api/auth/login` — Login, returns JWT
- `POST /api/auth/logout` — Logout (client-side token removal)
- `GET /api/auth/me` — Get current user from token

### Users (admin only)
- `GET /api/users` — List all users
- `POST /api/users` — Create new user account
- `PUT /api/users/:id` — Update user (toggle is_admin, reset password)
- `DELETE /api/users/:id` — Delete user

### Content Pages
- `GET /api/pages/:slug` — Get page by slug (public)
- `GET /api/pages?category=X` — List pages by category (public)
- `PUT /api/pages/:slug` — Update page content (admin)
- `POST /api/pages` — Create page (admin)

### Bloomberg
- `GET /api/bloomberg` — List all commands (public)
- `GET /api/bloomberg?category=X&search=Y` — Filter and search (public)
- `POST /api/bloomberg` — Add command (admin)
- `PUT /api/bloomberg/:id` — Update command (admin)
- `DELETE /api/bloomberg/:id` — Delete command (admin)

### Reading List
- `GET /api/books` — List all (public)
- `GET /api/books?category=X` — Filter (public)
- `POST /api/books` — Add (admin)
- `PUT /api/books/:id` — Update (admin)
- `DELETE /api/books/:id` — Delete (admin)

### News
- `GET /api/news` — Cached headlines (public)

### RAG Chat
- `POST /api/chat` — Send message (public)
- `GET /api/chat/:session_id` — Chat history (public)
- `GET /api/corpora` — List knowledge bases (public)

### Ingestion
- `POST /api/ingest` — Upload PDFs to corpus (admin)
- `GET /api/ingest/:corpus/status` — Ingestion status (admin)
- `DELETE /api/ingest/:corpus` — Clear corpus (admin)

### Health
- `GET /api/health` — Service health check (public)

---

## MVP Build Phases

### Phase 1: Foundation (Week 1)
- [ ] Docker Compose (React, Express, PostgreSQL + pgvector)
- [ ] Database migrations (all tables including users)
- [ ] Express API with health check
- [ ] Auth system: JWT login, bcrypt hashing, auth middleware
- [ ] Seed script: create first admin account
- [ ] React app with routing, nav bar, "Financial Forge" branding
- [ ] Login page
- [ ] Home page layout (placeholder)
- [ ] Page content API + markdown rendering

### Phase 2: Content & Admin (Week 2)
- [ ] Claude-draft all guide content (sector analysis, financial analysis, valuation)
- [ ] `/admin` dashboard: content editor, Bloomberg CRUD, books CRUD, user management
- [ ] Admin route protection (frontend + backend middleware)
- [ ] Bloomberg Guide page with search/filter
- [ ] Reading List page + seed data
- [ ] News feed (Finnhub + RSS)

### Phase 3: RAG Chat (Week 3)
- [ ] LLM provider abstraction (Gemini / Anthropic)
- [ ] Embedding provider abstraction
- [ ] PDF ingestion pipeline
- [ ] RAG query service with citations
- [ ] Chat UI ("Ask the Forge") with corpus dropdown
- [ ] Admin: PDF upload for ingestion
- [ ] Ingest Weekender PDFs (first corpus)

### Phase 4: Full Loading & Polish (Week 4+)
- [ ] Buffett letter download script
- [ ] Ingest all Buffett content
- [ ] Ingest Project 2025
- [ ] Auto-ingest site guide content
- [ ] Home page polish (Weekender highlight, quick links)
- [ ] Error handling + loading states
- [ ] Deploy
- [ ] Demo to Cary → iterate

---

## All Decisions — Final

| Decision | Choice |
|----------|--------|
| Project name | Financial Forge |
| Team size | 5–15, independent |
| Auth (MVP) | Basic accounts — email/password + is_admin flag |
| Auth (future) | Full roles: Admin, Contributor, Viewer |
| Registration | No public signup — admin creates accounts |
| Public access | All content + chat publicly readable, no login needed |
| Admin access | `/admin` route, requires login + is_admin |
| First admin | Created via seed script |
| LLM (dev) | Gemini free tier ($0) |
| LLM (prod) | Anthropic Claude Sonnet (~$5-20/mo) |
| Embeddings | Google free tier |
| Bloomberg source | Team documents from lab terminal |
| Content authoring | Claude drafts → you edit via admin |
| Content editing | Markdown editor at `/admin` |
| Mobile | Desktop only for MVP |
| Buffett letters | Auto-download script |
| Buffett scope | Shareholder + partnership letters + Superinvestors essay |
| Weekender corpus | ~50+ PDFs, uploaded via admin |
| Project 2025 focus | Economic/fiscal policy → market impact |
| NotebookLM | Manual links (no API) |
| Cary admin access | Not yet — you create his account when ready |
| News sources | Finnhub API + RSS feeds (free) |
| Hosting | TBD after MVP demo |

---

## Future Ideas
- Full role system (Admin, Contributor, Viewer)
- Watchlist / portfolio tracker
- Earnings calendar integration
- Discussion / comments on guides
- Bloomberg Terminal screenshots in guide
- Sector dashboards with live data
- Cary video embeds
- Mobile responsive
- NotebookLM API integration (if released)
