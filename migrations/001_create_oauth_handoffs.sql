CREATE TABLE oauth_handoffs (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'warcraftlogs',
    state VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'expired', 'consumed')),
    access_token TEXT,
    refresh_token TEXT,
    token_type VARCHAR(50),
    expires_in INTEGER,
    scope TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_oauth_handoffs_state ON oauth_handoffs(state);
CREATE INDEX idx_oauth_handoffs_status ON oauth_handoffs(status);
