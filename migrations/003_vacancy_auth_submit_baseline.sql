-- search-profile baseline tables (idempotent; local DBs may already have them via ensure*).
CREATE TABLE IF NOT EXISTS vacancy_auth (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password TEXT NOT NULL DEFAULT '',
    password_enc TEXT,
    enc_v SMALLINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS password_enc TEXT;
ALTER TABLE vacancy_auth ADD COLUMN IF NOT EXISTS enc_v SMALLINT;

CREATE TABLE IF NOT EXISTS vacancy_submit (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    position TEXT,
    message TEXT,
    vacancy_url TEXT,
    schedule TEXT,
    order_by TEXT,
    search_field TEXT,
    experience TEXT,
    search_period TEXT,
    vacancy_auth_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vacancy_submit ADD COLUMN IF NOT EXISTS vacancy_auth_id INTEGER;
