-- Switch from 768-dim (Google) to 1024-dim (Voyage AI) embeddings
-- Must re-embed all documents after this migration

-- Drop the old index
DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- Clear all existing embeddings (incompatible dimensions)
DELETE FROM document_chunks;

-- Alter the column to 1024 dimensions
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(1024);

-- Recreate the IVFFlat index (requires data for training, so we use HNSW instead)
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
