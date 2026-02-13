-- 003_chat.sql
-- Chat sessions and messages for RAG chat

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

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
