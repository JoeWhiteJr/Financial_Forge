-- 002_pgvector.sql
-- Vector extension and document_chunks table for RAG

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

CREATE INDEX idx_document_chunks_corpus ON document_chunks(corpus);

-- IVFFlat index for cosine similarity search
-- Note: requires at least some rows before it can be used effectively
CREATE INDEX idx_document_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
